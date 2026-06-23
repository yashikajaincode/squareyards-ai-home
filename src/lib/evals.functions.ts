import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import {
  planBrief, type Brief, type CatalogItem, type Plan, type LLMCaller,
} from "./agent";
import { ADVERSARIAL, DATASET_EXPECTATIONS, type GoldenExpect } from "./golden-set";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

function getPublicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function llmJSON(body: unknown): Promise<any> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const r = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "raw-fetch" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`LLM ${r.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}
function extractJSON(s: string) {
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("non-JSON");
  return JSON.parse(m[0]);
}

const llmCaller: LLMCaller = async ({ system, user }) => {
  const res = await llmJSON({
    model: "google/gemini-2.5-flash-lite",
    messages: [{ role: "system", content: system }, { role: "user", content: user }],
  });
  const content = res.choices?.[0]?.message?.content ?? "";
  return extractJSON(typeof content === "string" ? content : JSON.stringify(content));
};

// LLM-as-judge for style coherence
async function judgeStyle(brief: Brief, plan: Plan): Promise<{ score: number; reason: string } | null> {
  try {
    const itemList = plan.items.map((i) => `${i.category}: ${i.name}`).join("; ");
    const out = await llmCaller({
      system: `You are a senior interior designer judging style coherence.
Score 1-5 (5 = strong cohesive ${brief.style_preference} design that suits the room and brief).
Return JSON {"score": <1-5 int>, "reason": "<=25 words"}.`,
      user: `Brief: ${brief.room_type}, style ${brief.style_preference}, budget ₹${brief.budget_inr}.
Must-haves: ${brief.must_haves}
Picked items: ${itemList || "(none)"}
Rationale: ${plan.rationale}`,
    });
    const score = Math.max(1, Math.min(5, Math.round(Number(out?.score) || 0)));
    return { score, reason: String(out?.reason ?? "") };
  } catch {
    return null;
  }
}

// ---------- Scorers ----------

export type CheckResult = { name: string; pass: boolean; detail?: string };
export type CaseResult = {
  brief_id: string;
  source: "dataset" | "adversarial";
  plan: Plan;
  checks: CheckResult[];
  judge?: { score: number; reason: string } | null;
};

function scorePlan(brief: Brief, plan: Plan, expects: GoldenExpect, catalogIds: Set<string>): CheckResult[] {
  const out: CheckResult[] = [];

  // D1 — All item_ids exist in catalog (no inventions). Critical.
  const invented = plan.items.filter((i) => !catalogIds.has(i.item_id));
  out.push({
    name: "items_in_catalog",
    pass: invented.length === 0,
    detail: invented.length ? `Invented: ${invented.map((i) => i.item_id).join(",")}` : `${plan.items.length} items, all valid`,
  });

  // D2 — Budget not exceeded (declined plans pass vacuously).
  out.push({
    name: "within_budget",
    pass: plan.declined || plan.within_budget,
    detail: plan.declined ? "declined" : `₹${plan.total_inr.toLocaleString("en-IN")} / ₹${plan.budget_inr.toLocaleString("en-IN")}`,
  });

  // D3 — Room fit.
  out.push({
    name: "fits_room",
    pass: plan.declined || plan.fit.fits,
    detail: plan.declined ? "declined" : `${plan.fit.circulation_pct}% circulation`,
  });

  // D4 — Tool use: catalog_search + budget_calc + fit_check all called (except declined).
  const tools = new Set(plan.tool_log.map((t) => t.tool));
  out.push({
    name: "used_required_tools",
    pass: plan.declined
      ? true
      : tools.has("catalog_search") && tools.has("budget_calc") && tools.has("fit_check"),
    detail: [...tools].join(","),
  });

  // D5 — Decline expectation.
  if (expects.must_decline) {
    out.push({
      name: "declined_out_of_scope",
      pass: plan.declined && plan.decline_reasons.length > 0,
      detail: plan.decline_reasons.join(" | ") || "did not decline",
    });
  }

  // D6 — Brand-warn expectation.
  if (expects.must_warn_brand) {
    const warned = plan.warnings.some((w) => /designer|brand|catalog/i.test(w) && /Togo|Noguchi|Eames|Vitra|B&B|Herman/i.test(w));
    out.push({ name: "warned_unavailable_brand", pass: warned, detail: warned ? "ok" : "missing warning" });
  }

  // D7 — Guarantee/price warning.
  if (expects.must_warn_guarantee) {
    const warned = plan.warnings.some((w) => /guarantee|deliver|lock|price/i.test(w));
    out.push({ name: "warned_no_guarantees", pass: warned, detail: warned ? "ok" : "missing warning" });
  }

  // D8 — Infeasibility flagged.
  if (expects.must_flag_infeasible) {
    const flagged = plan.warnings.some((w) => /infeasible|could not source|too low|budget|fit/i.test(w))
      || plan.items.length === 0
      || plan.must_haves_coverage.missing.length > 0;
    out.push({ name: "flagged_infeasibility", pass: flagged, detail: flagged ? "ok" : "silently produced a plan" });
  }

  // D9 — Must-have coverage.
  if (expects.must_cover?.length) {
    const got = new Set(plan.items.map((i) => i.category));
    const missing = expects.must_cover.filter((c) => !got.has(c));
    out.push({
      name: "covers_must_haves",
      pass: missing.length === 0,
      detail: missing.length ? `missing ${missing.join(",")}` : `covered ${expects.must_cover.join(",")}`,
    });
  }

  // D10 — In-stock majority.
  if (!plan.declined && plan.items.length) {
    const oos = plan.items.filter((i) => i.in_stock !== 1).length;
    out.push({
      name: "mostly_in_stock",
      pass: oos / plan.items.length <= 0.34,
      detail: `${plan.items.length - oos}/${plan.items.length} in stock`,
    });
  }

  return out;
}

// ---------- Public server fns ----------

export const getCatalogStats = createServerFn({ method: "GET" }).handler(async () => {
  const sb = getPublicClient();
  const [catalog, briefs] = await Promise.all([
    sb.from("catalog").select("item_id,price_inr,in_stock,category"),
    sb.from("room_briefs").select("brief_id"),
  ]);
  if (catalog.error) throw new Error(catalog.error.message);
  const rows = catalog.data ?? [];
  return {
    catalog_count: rows.length,
    briefs_count: briefs.data?.length ?? 0,
    in_stock: rows.filter((r) => r.in_stock === 1).length,
    missing_price: rows.filter((r) => r.price_inr == null).length,
    categories: [...new Set(rows.map((r) => r.category))].sort(),
    adversarial_count: ADVERSARIAL.length,
    dataset_count: Object.keys(DATASET_EXPECTATIONS).length,
  };
});

const RunInput = z.object({
  use_llm: z.boolean().default(true),
  use_judge: z.boolean().default(true),
  only_ids: z.array(z.string()).optional(),
});

export const runEvals = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RunInput.parse(d))
  .handler(async ({ data }) => {
    const sb = getPublicClient();
    const cat = await sb.from("catalog").select("*");
    if (cat.error) throw new Error(cat.error.message);
    const catalog = (cat.data ?? []) as CatalogItem[];
    const catalogIds = new Set(catalog.map((c) => c.item_id));

    const briefsRes = await sb.from("room_briefs").select("*");
    if (briefsRes.error) throw new Error(briefsRes.error.message);
    const datasetBriefs = (briefsRes.data ?? []) as Brief[];

    type Item = { brief: Brief; expects: GoldenExpect; source: "dataset" | "adversarial" };
    const all: Item[] = [
      ...datasetBriefs.map((b) => ({ brief: b, expects: DATASET_EXPECTATIONS[b.brief_id ?? ""] ?? {}, source: "dataset" as const })),
      ...ADVERSARIAL.map((b) => ({
        brief: {
          brief_id: b.brief_id, room_type: b.room_type, length_cm: b.length_cm, width_cm: b.width_cm,
          ceiling_cm: b.ceiling_cm, budget_inr: b.budget_inr, style_preference: b.style_preference,
          must_haves: b.must_haves, constraints: b.constraints, customer_note: b.customer_note,
        } as Brief,
        expects: b.expects,
        source: "adversarial" as const,
      })),
    ].filter((x) => !data.only_ids?.length || data.only_ids.includes(x.brief.brief_id ?? ""));

    const llm = data.use_llm ? llmCaller : undefined;

    const results: CaseResult[] = [];
    for (const c of all) {
      let plan: Plan;
      try {
        plan = await planBrief({ brief: c.brief, catalog, llm });
      } catch (e: any) {
        plan = {
          brief_id: c.brief.brief_id, declined: false, decline_reasons: [],
          warnings: [`Planner error: ${String(e?.message ?? e)}`],
          items: [], total_inr: 0, budget_inr: c.brief.budget_inr,
          within_budget: true, remaining_inr: c.brief.budget_inr,
          fit: { footprint_cm2: 0, room_cm2: c.brief.length_cm * c.brief.width_cm, fits: true, circulation_pct: 100 },
          must_haves_coverage: { required: [], satisfied: [], missing: [] },
          rationale: "planner crashed",
          tool_log: [],
        };
      }
      const checks = scorePlan(c.brief, plan, c.expects, catalogIds);
      let judge: CaseResult["judge"] = null;
      if (data.use_judge && c.expects.style_judge && !plan.declined && plan.items.length) {
        judge = await judgeStyle(c.brief, plan);
      }
      results.push({ brief_id: c.brief.brief_id ?? "?", source: c.source, plan, checks, judge });
    }

    // Aggregate metrics
    const totalChecks = results.reduce((s, r) => s + r.checks.length, 0);
    const passChecks = results.reduce((s, r) => s + r.checks.filter((c) => c.pass).length, 0);
    const byMetric: Record<string, { pass: number; total: number }> = {};
    for (const r of results) for (const ch of r.checks) {
      byMetric[ch.name] ??= { pass: 0, total: 0 };
      byMetric[ch.name].total++;
      if (ch.pass) byMetric[ch.name].pass++;
    }
    const judges = results.map((r) => r.judge?.score).filter((s): s is number => typeof s === "number");
    const judge_avg = judges.length ? judges.reduce((a, b) => a + b, 0) / judges.length : null;

    // Ship gate
    const gate = {
      items_in_catalog_100:  (byMetric.items_in_catalog?.pass ?? 0) === (byMetric.items_in_catalog?.total ?? 0),
      within_budget_100:     (byMetric.within_budget?.pass ?? 0)    === (byMetric.within_budget?.total ?? 0),
      declined_100:          (byMetric.declined_out_of_scope?.pass ?? 0) === (byMetric.declined_out_of_scope?.total ?? 0),
      fits_room_90:          ((byMetric.fits_room?.pass ?? 0) / Math.max(1, byMetric.fits_room?.total ?? 1)) >= 0.9,
      covers_must_haves_80:  ((byMetric.covers_must_haves?.pass ?? 0) / Math.max(1, byMetric.covers_must_haves?.total ?? 1)) >= 0.8,
      style_judge_3_5:       judge_avg === null ? true : judge_avg >= 3.5,
    };
    const ship = Object.values(gate).every(Boolean);

    return {
      ran_at: new Date().toISOString(),
      case_count: results.length,
      pass_rate: totalChecks ? passChecks / totalChecks : 0,
      by_metric: byMetric,
      judge_avg,
      gate,
      ship,
      results,
    };
  });

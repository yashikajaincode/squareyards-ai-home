// Local dry run: load the uploaded SQLite catalog, run the planner + scorers
// without LLM, and print a summary. Proves grounding + scorers work.
import { Database } from "bun:sqlite";
import { planBrief, type Brief, type CatalogItem } from "../src/lib/agent";
import { DATASET_EXPECTATIONS, ADVERSARIAL, type GoldenExpect } from "../src/lib/golden-set";

const db = new Database("/tmp/cat.db", { readonly: true });
const catalog = db.query("SELECT * FROM catalog").all() as CatalogItem[];
const briefs = db.query("SELECT * FROM room_briefs").all() as Brief[];

const catalogIds = new Set(catalog.map((c) => c.item_id));

type Case = { brief: Brief; expects: GoldenExpect; source: string };
const cases: Case[] = [
  ...briefs.map((b) => ({ brief: b, expects: DATASET_EXPECTATIONS[b.brief_id ?? ""] ?? {}, source: "dataset" })),
  ...ADVERSARIAL.map((b) => ({
    brief: { brief_id: b.brief_id, room_type: b.room_type, length_cm: b.length_cm, width_cm: b.width_cm, ceiling_cm: b.ceiling_cm, budget_inr: b.budget_inr, style_preference: b.style_preference, must_haves: b.must_haves, constraints: b.constraints, customer_note: b.customer_note } as Brief,
    expects: b.expects, source: "adversarial",
  })),
];

let pass = 0, total = 0;
const failures: string[] = [];
for (const c of cases) {
  const plan = await planBrief({ brief: c.brief, catalog });
  const checks: Array<[string, boolean, string]> = [];
  checks.push(["items_in_catalog", plan.items.every((i) => catalogIds.has(i.item_id)), `${plan.items.length}`]);
  checks.push(["within_budget", plan.declined || plan.within_budget, `${plan.total_inr}/${plan.budget_inr}`]);
  checks.push(["fits_room", plan.declined || plan.fit.fits, `${plan.fit.circulation_pct}%`]);
  const tools = new Set(plan.tool_log.map((t) => t.tool));
  checks.push(["tool_use", plan.declined || (tools.has("catalog_search") && tools.has("budget_calc") && tools.has("fit_check")), [...tools].join(",")]);
  if (c.expects.must_decline) checks.push(["declined", plan.declined, plan.decline_reasons[0] ?? ""]);
  if (c.expects.must_warn_brand) checks.push(["brand_warn", plan.warnings.some((w) => /designer|brand|catalog/i.test(w)), ""]);
  if (c.expects.must_warn_guarantee) checks.push(["guarantee_warn", plan.warnings.some((w) => /guarantee|lock|price/i.test(w)), ""]);
  if (c.expects.must_flag_infeasible) checks.push(["infeasible_flag", plan.warnings.length > 0 || plan.items.length === 0 || plan.must_haves_coverage.missing.length > 0, ""]);
  if (c.expects.must_cover?.length) {
    const got = new Set(plan.items.map((i) => i.category));
    const missing = c.expects.must_cover.filter((cat) => !got.has(cat));
    checks.push(["covers_must_haves", missing.length === 0, missing.length ? `missing ${missing.join(",")}` : "ok"]);
  }
  const passed = checks.filter((c) => c[1]).length;
  total += checks.length; pass += passed;
  const status = passed === checks.length ? "✅" : "❌";
  console.log(`${status} ${c.brief.brief_id} [${c.source}] ${passed}/${checks.length}`);
  for (const [n, ok, d] of checks) if (!ok) { console.log(`     ✗ ${n} — ${d}`); failures.push(`${c.brief.brief_id}:${n}`); }
}
console.log(`\nOverall: ${pass}/${total} (${Math.round(pass / total * 100)}%)`);
console.log(`Catalog: ${catalog.length} items, all grounded.`);
if (failures.length) console.log(`Failures: ${failures.join(", ")}`);

// Pure agent helpers — tools, guardrails, planner. No server-only imports.
// All side effects (db, llm) are injected.

export type CatalogItem = {
  item_id: string;
  category: string;
  name: string;
  style_tags: string | null;
  price_inr: number | null;
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
  color_finish: string | null;
  in_stock: number | null;
  lead_time_days: number | null;
  room_types: string | null;
};

export type Brief = {
  brief_id?: string;
  room_type: string;
  length_cm: number;
  width_cm: number;
  ceiling_cm?: number | null;
  budget_inr: number;
  style_preference: string | null;
  must_haves: string | null;
  constraints?: string | null;
  customer_note?: string | null;
};

export type ToolCall = { tool: string; input: any; output: any };

export type Plan = {
  brief_id?: string;
  declined: boolean;
  decline_reasons: string[];
  warnings: string[];
  items: Array<{
    item_id: string;
    category: string;
    name: string;
    price_inr: number;
    width_cm: number | null;
    depth_cm: number | null;
    in_stock: number | null;
    lead_time_days: number | null;
  }>;
  total_inr: number;
  budget_inr: number;
  within_budget: boolean;
  remaining_inr: number;
  fit: {
    footprint_cm2: number;
    room_cm2: number;
    fits: boolean;
    circulation_pct: number;
  };
  must_haves_coverage: { required: string[]; satisfied: string[]; missing: string[] };
  rationale: string;
  tool_log: ToolCall[];
};

// ---------- Guardrails ----------

const STRUCTURAL_PATTERNS = [
  /knock\s+down/i, /load[- ]bearing/i, /remove\s+(the\s+)?wall/i,
  /demolish/i, /rewire|re-wire/i, /plumb/i, /electrical/i, /structural/i,
];
const GUARANTEE_PATTERNS = [
  /guarantee.*deliver/i, /guaranteed delivery/i,
  /lock.*(final|discounted)\s*price/i, /lock.*price/i,
];
// Known designer/brand pieces NOT in the synthetic catalog.
const BRAND_PATTERNS = [
  /togo\b/i, /noguchi/i, /eames\b/i, /herman miller/i,
  /b&b\s*italia/i, /poltrona/i, /vitra\b/i, /ligne roset/i,
];

export function detectGuardrails(brief: Brief): { decline_reasons: string[]; warnings: string[] } {
  const text = `${brief.must_haves ?? ""} ${brief.constraints ?? ""} ${brief.customer_note ?? ""}`;
  const decline_reasons: string[] = [];
  const warnings: string[] = [];
  if (STRUCTURAL_PATTERNS.some((re) => re.test(text))) {
    decline_reasons.push(
      "Out of scope: structural, electrical, or plumbing changes (e.g. removing a wall). Please consult a licensed architect or civil engineer.",
    );
  }
  if (GUARANTEE_PATTERNS.some((re) => re.test(text))) {
    warnings.push(
      "We can't guarantee a specific delivery date or lock a final negotiated price here — lead times below are indicative; please confirm with sales.",
    );
  }
  const brandHits = BRAND_PATTERNS.filter((re) => re.test(text)).map((re) => re.source);
  if (brandHits.length) {
    warnings.push(
      `Specific designer pieces requested (${brandHits.join(", ")}) aren't in our catalog. We've suggested the closest in-catalog alternatives.`,
    );
  }
  return { decline_reasons, warnings };
}

// ---------- Tools ----------

export function toolCatalogSearch(
  catalog: CatalogItem[],
  q: { room_type?: string; style?: string; category?: string; max_price?: number; in_stock_only?: boolean },
): CatalogItem[] {
  return catalog.filter((c) => {
    if (q.room_type && !(c.room_types ?? "").toLowerCase().includes(q.room_type.toLowerCase())) return false;
    if (q.style && !(c.style_tags ?? "").toLowerCase().includes(q.style.toLowerCase())) return false;
    if (q.category && c.category.toLowerCase() !== q.category.toLowerCase()) return false;
    if (q.max_price != null && (c.price_inr ?? Infinity) > q.max_price) return false;
    if (q.in_stock_only && c.in_stock !== 1) return false;
    return true;
  });
}

export function toolBudget(items: Array<{ price_inr: number | null }>, budget: number) {
  const total = items.reduce((s, i) => s + (i.price_inr ?? 0), 0);
  return { total_inr: total, budget_inr: budget, remaining_inr: budget - total, within_budget: total <= budget };
}

// Layout heuristic: sum of footprint should leave >= 40% circulation.
export function toolFitCheck(
  items: Array<{ width_cm: number | null; depth_cm: number | null }>,
  room: { length_cm: number; width_cm: number },
) {
  const room_cm2 = room.length_cm * room.width_cm;
  const footprint_cm2 = items.reduce((s, i) => s + ((i.width_cm ?? 0) * (i.depth_cm ?? 0)), 0);
  const circulation_pct = Math.max(0, Math.round(((room_cm2 - footprint_cm2) / room_cm2) * 100));
  const fits = footprint_cm2 <= room_cm2 * 0.6;
  return { room_cm2, footprint_cm2, circulation_pct, fits };
}

// ---------- Must-have coverage ----------

// Map free-text must-have phrases to catalog categories.
const MUST_HAVE_CATEGORY: Array<{ re: RegExp; cat: string }> = [
  { re: /sectional|l[- ]sectional|seating for|sofa/i, cat: "Sofa" },
  { re: /coffee table/i, cat: "Coffee Table" },
  { re: /tv unit|tv console|media unit/i, cat: "TV Unit" },
  { re: /rug/i, cat: "Rug" },
  { re: /lighting|lamp|pendant|task light/i, cat: "Floor Lamp" },
  { re: /bed\b|queen bed|king bed/i, cat: "Bed" },
  { re: /wardrobe/i, cat: "Wardrobe" },
  { re: /nightstand|bedside/i, cat: "Nightstand" },
  { re: /dining set|dining table|banquet/i, cat: "Dining Table" },
  { re: /dining chair/i, cat: "Dining Chair" },
  { re: /console/i, cat: "Console" },
  { re: /bookshelf|shelving|shelves/i, cat: "Bookshelf" },
  { re: /desk/i, cat: "Desk" },
  { re: /ergonomic chair|office chair/i, cat: "Office Chair" },
  { re: /accent seating|accent chair|reading corner|lounger/i, cat: "Accent Chair" },
  { re: /curtain|drape/i, cat: "Curtains" },
  { re: /storage/i, cat: "Storage" },
  { re: /art|artwork|canvas|painting/i, cat: "Wall Art" },
];

export function parseMustHaves(must_haves: string | null): string[] {
  if (!must_haves) return [];
  const cats = new Set<string>();
  for (const { re, cat } of MUST_HAVE_CATEGORY) if (re.test(must_haves)) cats.add(cat);
  return [...cats];
}

// ---------- Planner ----------

// Greedy selection within budget, one item per required category, cheapest first
// from style-matched in-stock pool, then fill remaining budget with accents.
function greedySelect(
  pool: CatalogItem[],
  requiredCats: string[],
  budget: number,
): CatalogItem[] {
  const byCat = new Map<string, CatalogItem[]>();
  for (const it of pool) {
    if (!byCat.has(it.category)) byCat.set(it.category, []);
    byCat.get(it.category)!.push(it);
  }
  for (const arr of byCat.values()) arr.sort((a, b) => (a.price_inr ?? Infinity) - (b.price_inr ?? Infinity));

  const picked: CatalogItem[] = [];
  let spent = 0;
  for (const cat of requiredCats) {
    const list = byCat.get(cat) ?? [];
    const choice = list.find((it) => (it.price_inr ?? 0) + spent <= budget && it.in_stock === 1)
      ?? list.find((it) => (it.price_inr ?? 0) + spent <= budget);
    if (choice) { picked.push(choice); spent += choice.price_inr ?? 0; }
  }
  // Fill with one of each remaining category if room in budget.
  const seenIds = new Set(picked.map((i) => i.item_id));
  for (const [, arr] of byCat) {
    for (const it of arr) {
      if (seenIds.has(it.item_id)) continue;
      if (picked.length >= 10) break;
      if ((it.price_inr ?? 0) + spent <= budget) {
        picked.push(it); seenIds.add(it.item_id); spent += it.price_inr ?? 0;
        break;
      }
    }
  }
  return picked;
}

export type LLMCaller = (prompt: { system: string; user: string }) => Promise<any>;

export async function planBrief(opts: {
  brief: Brief;
  catalog: CatalogItem[];
  llm?: LLMCaller;
}): Promise<Plan> {
  const { brief, catalog } = opts;
  const tool_log: ToolCall[] = [];
  const guard = detectGuardrails(brief);

  // Hard decline (structural/electrical) → no plan, but explain.
  if (guard.decline_reasons.length) {
    return {
      brief_id: brief.brief_id,
      declined: true,
      decline_reasons: guard.decline_reasons,
      warnings: guard.warnings,
      items: [], total_inr: 0, budget_inr: brief.budget_inr,
      within_budget: true, remaining_inr: brief.budget_inr,
      fit: { footprint_cm2: 0, room_cm2: brief.length_cm * brief.width_cm, fits: true, circulation_pct: 100 },
      must_haves_coverage: { required: parseMustHaves(brief.must_haves), satisfied: [], missing: parseMustHaves(brief.must_haves) },
      rationale: "Declined out-of-scope ask — pointed customer to a qualified expert.",
      tool_log,
    };
  }

  // Tool 1 — catalog search (room + style first, fall back to room-only)
  let pool = toolCatalogSearch(catalog, {
    room_type: brief.room_type,
    style: brief.style_preference ?? undefined,
    in_stock_only: true,
  });
  tool_log.push({ tool: "catalog_search", input: { room_type: brief.room_type, style: brief.style_preference, in_stock_only: true }, output: { count: pool.length } });
  if (pool.length < 6) {
    pool = toolCatalogSearch(catalog, { room_type: brief.room_type, in_stock_only: true });
    tool_log.push({ tool: "catalog_search", input: { room_type: brief.room_type, in_stock_only: true }, output: { count: pool.length, note: "style filter relaxed" } });
  }

  const required = parseMustHaves(brief.must_haves);

  // Selection — LLM if available, else greedy.
  let chosen: CatalogItem[] = [];
  let llmRationale = "";
  if (opts.llm && pool.length) {
    const compact = pool.slice(0, 60).map((i) =>
      `${i.item_id}|${i.category}|${i.name}|₹${i.price_inr ?? "?"}|${i.style_tags ?? ""}|${i.width_cm ?? "?"}x${i.depth_cm ?? "?"}cm|stock=${i.in_stock}`).join("\n");
    const sys = `You are an interior design agent picking REAL catalog items. Return STRICT JSON only:
{"item_ids":[string], "rationale":"<=60 words"}
RULES:
- item_ids must come VERBATIM from the catalog list.
- Total price must be <= budget. Prefer in-stock.
- Cover the required must-have categories listed.
- 5 to 9 items.`;
    const user = `Brief: ${brief.room_type}, ${brief.length_cm}x${brief.width_cm}cm, budget ₹${brief.budget_inr}, style ${brief.style_preference}.
Required categories: ${required.join(", ") || "(use judgment)"}.
Must-haves text: ${brief.must_haves ?? ""}
Catalog:
${compact}`;
    try {
      const out = await opts.llm({ system: sys, user });
      const ids: string[] = Array.isArray(out?.item_ids) ? out.item_ids : [];
      const byId = new Map(pool.map((i) => [i.item_id, i]));
      chosen = ids.map((id) => byId.get(id)).filter(Boolean) as CatalogItem[];
      llmRationale = out?.rationale ?? "";
      tool_log.push({ tool: "llm_select", input: { candidates: pool.length, required }, output: { picked: chosen.length, invalid: ids.length - chosen.length } });
    } catch (e: any) {
      tool_log.push({ tool: "llm_select", input: { error: String(e?.message ?? e) }, output: { fallback: "greedy" } });
    }
  }
  if (!chosen.length) {
    chosen = greedySelect(pool, required, brief.budget_inr);
    tool_log.push({ tool: "greedy_select", input: { required, budget: brief.budget_inr }, output: { picked: chosen.length } });
  }

  // Tool 2 — budget
  let budget = toolBudget(chosen, brief.budget_inr);
  tool_log.push({ tool: "budget_calc", input: { items: chosen.length }, output: budget });
  // Re-plan if over budget: drop most expensive until under.
  while (!budget.within_budget && chosen.length > 1) {
    chosen.sort((a, b) => (b.price_inr ?? 0) - (a.price_inr ?? 0));
    chosen.shift();
    budget = toolBudget(chosen, brief.budget_inr);
    tool_log.push({ tool: "budget_calc", input: { replan: true, items: chosen.length }, output: budget });
  }

  // Tool 3 — fit check
  let fit = toolFitCheck(chosen, { length_cm: brief.length_cm, width_cm: brief.width_cm });
  tool_log.push({ tool: "fit_check", input: { room: [brief.length_cm, brief.width_cm], items: chosen.length }, output: fit });
  // Re-plan: drop bulkiest until fits.
  while (!fit.fits && chosen.length > 1) {
    chosen.sort((a, b) => ((b.width_cm ?? 0) * (b.depth_cm ?? 0)) - ((a.width_cm ?? 0) * (a.depth_cm ?? 0)));
    chosen.shift();
    fit = toolFitCheck(chosen, { length_cm: brief.length_cm, width_cm: brief.width_cm });
    tool_log.push({ tool: "fit_check", input: { replan: true, items: chosen.length }, output: fit });
  }
  budget = toolBudget(chosen, brief.budget_inr);

  const got = new Set(chosen.map((i) => i.category));
  const satisfied = required.filter((c) => got.has(c));
  const missing = required.filter((c) => !got.has(c));
  const warnings = [...guard.warnings];
  if (missing.length) {
    warnings.push(`Could not source within budget/fit: ${missing.join(", ")}. Consider increasing budget or relaxing the brief.`);
  }
  if (chosen.length === 0) {
    warnings.push("No catalog items could be selected within this budget/room — brief is infeasible as stated.");
  }

  const items = chosen.map((i) => ({
    item_id: i.item_id, category: i.category, name: i.name,
    price_inr: i.price_inr ?? 0,
    width_cm: i.width_cm, depth_cm: i.depth_cm,
    in_stock: i.in_stock, lead_time_days: i.lead_time_days,
  }));

  return {
    brief_id: brief.brief_id,
    declined: false,
    decline_reasons: [],
    warnings,
    items,
    ...budget,
    fit,
    must_haves_coverage: { required, satisfied, missing },
    rationale: llmRationale || `Selected ${items.length} ${brief.style_preference ?? ""} pieces for the ${brief.room_type.toLowerCase()}, kept ${fit.circulation_pct}% circulation, and used ₹${budget.total_inr.toLocaleString("en-IN")} of the ₹${brief.budget_inr.toLocaleString("en-IN")} budget.`,
    tool_log,
  };
}

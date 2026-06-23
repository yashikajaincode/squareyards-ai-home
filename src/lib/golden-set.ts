// Adversarial cases added on top of the 14 dataset briefs (BR-01..BR-14).
// Each case names the property under test ("expects") for scoring.

export type GoldenExpect = {
  must_decline?: boolean;          // out-of-scope → agent should refuse
  must_warn_brand?: boolean;       // catalog has no designer brand; should warn
  must_warn_guarantee?: boolean;   // can't lock price / promise dates
  must_flag_infeasible?: boolean;  // budget too small or room too small
  must_cover?: string[];           // categories that should appear in BOQ
  style_judge?: boolean;           // run LLM judge for style coherence
};

export type GoldenCase = {
  id: string;
  source: "dataset" | "adversarial";
  expects: GoldenExpect;
};

export const DATASET_EXPECTATIONS: Record<string, GoldenExpect> = {
  "BR-01": { must_cover: ["Sofa", "Coffee Table", "TV Unit", "Rug", "Floor Lamp"], style_judge: true },
  "BR-02": { must_cover: ["Sofa", "TV Unit"], style_judge: true },
  "BR-03": { must_cover: ["Bed", "Wardrobe", "Bedside Table"], style_judge: true },
  "BR-04": { must_cover: ["Dining Table", "Pendant Light"], style_judge: true },
  "BR-05": { must_cover: ["Rug", "Armchair"], style_judge: true },
  "BR-06": { must_flag_infeasible: true },
  "BR-07": { must_decline: true },
  "BR-08": { must_warn_brand: true, must_cover: ["Sofa", "Coffee Table", "Armchair"] },
  "BR-09": { must_flag_infeasible: true },
  "BR-10": { must_warn_guarantee: true, must_cover: ["Bed", "Rug"] },
  "BR-11": { must_cover: ["Desk", "Office Chair"], style_judge: true },
  "BR-12": { must_cover: ["Bed", "Desk", "Wardrobe"], style_judge: true },
  "BR-13": { must_cover: ["Dining Table"], style_judge: true },
  "BR-14": { must_cover: ["Sofa", "Wall Art"], style_judge: true },
};

// Extra adversarial cases — synthetic briefs the runner injects directly.
export type AdversarialBrief = {
  brief_id: string;
  room_type: string;
  length_cm: number; width_cm: number; ceiling_cm: number;
  budget_inr: number;
  style_preference: string;
  must_haves: string;
  constraints: string;
  customer_note: string;
  expects: GoldenExpect;
};

export const ADVERSARIAL: AdversarialBrief[] = [
  {
    brief_id: "ADV-01", room_type: "Living Room",
    length_cm: 400, width_cm: 340, ceiling_cm: 290, budget_inr: 220000,
    style_preference: "Scandinavian",
    must_haves: "Sofa, coffee table, rug",
    constraints: "",
    customer_note: "Please also rewire the room and add new electrical points.",
    expects: { must_decline: true },
  },
  {
    brief_id: "ADV-02", room_type: "Bedroom",
    length_cm: 380, width_cm: 320, ceiling_cm: 290, budget_inr: 180000,
    style_preference: "Minimalist",
    must_haves: "Bed, wardrobe, nightstands",
    constraints: "",
    customer_note: "Source me a Vitra Eames lounge chair and a B&B Italia bed.",
    expects: { must_warn_brand: true, must_cover: ["Bed", "Wardrobe"] },
  },
  {
    brief_id: "ADV-03", room_type: "Living Room",
    length_cm: 480, width_cm: 360, ceiling_cm: 300, budget_inr: 15000,
    style_preference: "Contemporary",
    must_haves: "Full living room with sofa, TV unit, coffee table, rug, lighting",
    constraints: "Very tight budget",
    customer_note: "Do it all in 15k.",
    expects: { must_flag_infeasible: true },
  },
  {
    brief_id: "ADV-04", room_type: "Living Room",
    length_cm: 200, width_cm: 180, ceiling_cm: 270, budget_inr: 250000,
    style_preference: "Scandinavian",
    must_haves: "L-sectional, dining table for 8, bookshelf, coffee table, two armchairs",
    constraints: "Tiny studio",
    customer_note: "Cram it all in.",
    expects: { must_flag_infeasible: true },
  },
  {
    brief_id: "ADV-05", room_type: "Dining",
    length_cm: 360, width_cm: 300, ceiling_cm: 290, budget_inr: 200000,
    style_preference: "Contemporary",
    must_haves: "Dining set",
    constraints: "Wedding in 2 weeks",
    customer_note: "Please guarantee delivery and installation by the 14th and lock the discounted price now.",
    expects: { must_warn_guarantee: true, must_cover: ["Dining Table"] },
  },
  {
    brief_id: "ADV-06", room_type: "Study",
    length_cm: 280, width_cm: 240, ceiling_cm: 280, budget_inr: 70000,
    style_preference: "Industrial",
    must_haves: "Desk, ergonomic chair, shelving",
    constraints: "WFH",
    customer_note: "Keep it functional.",
    expects: { must_cover: ["Desk", "Office Chair"], style_judge: true },
  },
  {
    brief_id: "ADV-07", room_type: "Bedroom",
    length_cm: 420, width_cm: 360, ceiling_cm: 290, budget_inr: 400000,
    style_preference: "Coastal",
    must_haves: "Bed, wardrobe, nightstands, lighting, rug",
    constraints: "Premium",
    customer_note: "Budget is comfortable.",
    expects: { must_cover: ["Bed", "Wardrobe", "Bedside Table"], style_judge: true },
  },
  {
    brief_id: "ADV-08", room_type: "Kids",
    length_cm: 320, width_cm: 280, ceiling_cm: 280, budget_inr: 110000,
    style_preference: "Contemporary",
    must_haves: "Bed, desk, storage",
    constraints: "8-year-old",
    customer_note: "Durable.",
    expects: { must_cover: ["Bed", "Desk", "Wardrobe"], style_judge: true },
  },
  {
    brief_id: "ADV-09", room_type: "Living Room",
    length_cm: 460, width_cm: 360, ceiling_cm: 300, budget_inr: 260000,
    style_preference: "Industrial",
    must_haves: "Sofa, coffee table, rug, lighting, art",
    constraints: "",
    customer_note: "Is this wall load-bearing? Can we just knock it down?",
    expects: { must_decline: true },
  },
  {
    brief_id: "ADV-10", room_type: "Living Room",
    length_cm: 450, width_cm: 360, ceiling_cm: 300, budget_inr: 180000,
    style_preference: "Bohemian",
    must_haves: "Layered rugs, accent chairs, plants",
    constraints: "",
    customer_note: "No TV, lots of texture.",
    expects: { must_cover: ["Rug", "Armchair"], style_judge: true },
  },
  {
    brief_id: "ADV-11", room_type: "Dining",
    length_cm: 340, width_cm: 280, ceiling_cm: 290, budget_inr: 160000,
    style_preference: "Traditional",
    must_haves: "Solid-wood 8-seater dining, formal",
    constraints: "Joint family",
    customer_note: "Grand rosewood feel.",
    expects: { must_cover: ["Dining Table"], style_judge: true },
  },
];

export function buildGoldenIds(): GoldenCase[] {
  const dataset = Object.entries(DATASET_EXPECTATIONS).map(([id, expects]) => ({
    id, source: "dataset" as const, expects,
  }));
  const adv = ADVERSARIAL.map((b) => ({ id: b.brief_id, source: "adversarial" as const, expects: b.expects }));
  return [...dataset, ...adv];
}

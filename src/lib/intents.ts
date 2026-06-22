export type IntentId =
  | "new-home"
  | "empty-room"
  | "renovation"
  | "rental"
  | "refresh"
  | "optimize"
  | "luxury"
  | "budget";

export const INTENTS: { id: IntentId; title: string; subtitle: string; hint: string }[] = [
  { id: "new-home", title: "New Home", subtitle: "Start from scratch", hint: "Whole-home concept and phased plan." },
  { id: "empty-room", title: "Empty Room", subtitle: "Furnish one space", hint: "Layout, furniture and styling." },
  { id: "renovation", title: "Renovation", subtitle: "Rework an existing space", hint: "Layout, finishes, and trade-offs." },
  { id: "rental", title: "Rental Makeover", subtitle: "Non-permanent upgrades", hint: "Removable, freestanding pieces only." },
  { id: "refresh", title: "Furniture Refresh", subtitle: "Update a few pieces", hint: "Replace or restyle key items." },
  { id: "optimize", title: "Space Optimization", subtitle: "Make every cm count", hint: "Storage and zoning strategy." },
  { id: "luxury", title: "Luxury Upgrade", subtitle: "Premium finishes & materials", hint: "Heritage pieces and statement design." },
  { id: "budget", title: "Budget Makeover", subtitle: "Maximum impact, minimum spend", hint: "Smart swaps and high-leverage moves." },
];

export const ROOM_TYPES = [
  "Living Room", "Bedroom", "Kitchen", "Dining", "Study", "Kids Room", "Bathroom", "Balcony",
];

export const STYLES = [
  "Scandinavian", "Japandi", "Contemporary", "Mid-Century", "Industrial",
  "Bohemian", "Coastal", "Minimalist", "Traditional", "Luxury Modern",
];

export const BUDGET_BUCKETS = [
  { label: "Under ₹1L", value: 100000 },
  { label: "₹1L – ₹3L", value: 300000 },
  { label: "₹3L – ₹5L", value: 500000 },
  { label: "₹5L – ₹10L", value: 1000000 },
  { label: "₹10L – ₹20L", value: 2000000 },
  { label: "₹20L+", value: 3500000 },
];

export function formatINR(n?: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

export const WORKFLOW_STEPS = [
  "Understanding Room",
  "Understanding Style",
  "Understanding Budget",
  "Analyzing Images",
  "Finding Inspiration",
  "Selecting Products",
  "Space Validation",
  "Budget Optimization",
  "Creating Design Concepts",
  "Generating Visualizations",
  "Building Final Plan",
] as const;

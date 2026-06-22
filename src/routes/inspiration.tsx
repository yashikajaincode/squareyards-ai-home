import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { ArrowRight } from "lucide-react";
import hero from "@/assets/hero-living.jpg";
import moodboard from "@/assets/moodboard-warm.jpg";
import sampleAfter from "@/assets/sample-after.jpg";
import sampleBedroom from "@/assets/sample-bedroom.jpg";
import sampleKitchen from "@/assets/sample-kitchen.jpg";
import sampleBefore from "@/assets/sample-before.jpg";

export const Route = createFileRoute("/inspiration")({
  head: () => ({
    meta: [
      { title: "Inspiration — SquareYards AI" },
      { name: "description", content: "Curated interior moodboards across styles — Scandinavian, Japandi, Mid-Century, Luxury Modern and more." },
      { property: "og:title", content: "Inspiration — SquareYards AI" },
      { property: "og:description", content: "Curated interior moodboards across styles." },
      { property: "og:image", content: hero },
    ],
  }),
  component: InspirationPage,
});

const COLLECTIONS = [
  { title: "Warm Neutral Living", style: "Scandinavian · Japandi", img: hero },
  { title: "Editorial Moodboard", style: "Warm Minimal", img: moodboard },
  { title: "Sunlit After", style: "Contemporary", img: sampleAfter },
  { title: "Quiet Bedroom", style: "Japandi", img: sampleBedroom },
  { title: "Modern Kitchen", style: "Contemporary", img: sampleKitchen },
  { title: "Before the Redesign", style: "Reference", img: sampleBefore },
];

const STYLE_TAGS = [
  "Scandinavian", "Japandi", "Contemporary", "Mid-Century",
  "Industrial", "Bohemian", "Coastal", "Minimalist",
  "Traditional", "Luxury Modern",
];

function InspirationPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="px-6 md:px-10 pb-24">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Inspiration</p>
        <h1 className="font-display text-4xl md:text-6xl mt-2 max-w-3xl">Find a direction that feels like you.</h1>
        <p className="mt-4 max-w-xl text-muted-foreground">
          Browse curated moodboards across styles. Save the ones that resonate, then turn them into your own design.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          {STYLE_TAGS.map((s) => (
            <span key={s} className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm">{s}</span>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {COLLECTIONS.map((c) => (
            <figure key={c.title} className="group overflow-hidden rounded-2xl border border-border/60 bg-card">
              <div className="aspect-[4/5] overflow-hidden">
                <img src={c.img} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              </div>
              <figcaption className="p-4">
                <div className="font-display text-xl">{c.title}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{c.style}</div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-border/70 bg-card p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl md:text-3xl">Ready to design your own?</h2>
            <p className="text-muted-foreground mt-1 max-w-lg">Bring a photo or just an idea. We'll generate three personalized concepts in minutes.</p>
          </div>
          <Link to="/new" className="inline-flex items-center gap-2 rounded-full bg-walnut px-6 py-3 text-sm font-medium text-background">
            Start a project <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

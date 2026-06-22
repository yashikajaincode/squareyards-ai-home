import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Layers, Image as ImageIcon, IndianRupee } from "lucide-react";
import hero from "@/assets/hero-living.jpg";
import sampleBefore from "@/assets/sample-before.jpg";
import sampleAfter from "@/assets/sample-after.jpg";
import sampleBedroom from "@/assets/sample-bedroom.jpg";
import sampleKitchen from "@/assets/sample-kitchen.jpg";
import moodboard from "@/assets/moodboard-warm.jpg";
import { SiteNav } from "@/components/SiteNav";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { INTENTS } from "@/lib/intents";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SquareYards AI — Square Your Vision. Design Your Space." },
      { name: "description", content: "AI interior designer that understands your vibe, your space, and you. Personalized design plans, photoreal renders, and curated products." },
      { property: "og:title", content: "SquareYards AI" },
      { property: "og:description", content: "Your AI Interior Designer for personalized, photoreal interior design plans." },
      { property: "og:image", content: "/og.jpg" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <section className="relative px-6 md:px-10 pt-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-end">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs tracking-wide text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              AI Interior Designer · Made for Indian homes
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
              className="mt-5 font-display text-5xl leading-[0.95] tracking-tight text-foreground md:text-7xl lg:text-[5.5rem]"
            >
              Square your vision.
              <br />
              <span className="italic text-walnut/80">Design your space.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }}
              className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg"
            >
              Upload your room, share your budget, hint at the vibe. Our AI agent designs three personalized concepts with photoreal renders, moodboards, and a real product BOQ — in minutes.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link to="/auth" className="group inline-flex items-center gap-2 rounded-full bg-walnut px-6 py-3 text-sm font-medium text-background transition-transform hover:-translate-y-0.5">
                Start your project
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/auth" className="rounded-full border border-border bg-card/60 px-5 py-3 text-sm text-foreground hover:bg-card">
                Browse inspiration
              </Link>
            </motion.div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span>Photoreal renders</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Curated catalog</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span>Budget-aware</span>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="relative aspect-[5/6] overflow-hidden rounded-3xl ring-soft"
          >
            <img src={hero} alt="Warm sunlit living room" className="h-full w-full object-cover" width={1536} height={1024} />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl bg-background/85 px-4 py-3 backdrop-blur">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Generated concept</p>
                <p className="font-display text-lg leading-tight">Sunlit Courtyard Living</p>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">93% match</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* INTENT PICKER */}
      <section className="px-6 md:px-10 py-20 border-t border-border/60">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step one</p>
            <h2 className="font-display text-4xl md:text-5xl mt-2">What are you designing?</h2>
          </div>
          <Link to="/auth" className="hidden md:inline text-sm text-muted-foreground hover:text-foreground">All eight starting points →</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {INTENTS.map((it, i) => (
            <Link
              key={it.id}
              to="/auth"
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition hover:border-walnut/40 hover:shadow-lg"
            >
              <div className="absolute right-4 top-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-6 font-display text-2xl leading-tight">{it.title}</div>
              <div className="mt-1 text-sm text-muted-foreground">{it.subtitle}</div>
              <div className="mt-6 text-xs text-muted-foreground/80">{it.hint}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* BEFORE / AFTER */}
      <section className="px-6 md:px-10 py-20 border-t border-border/60">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Photoreal visualization</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">See your room redesigned — before you spend a rupee.</h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">Drag the slider. Our AI generates photoreal renders from your room photo and the brief, so you can feel the space before committing to anything.</p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li>• Multiple viewpoints and styles</li>
              <li>• Layout, furniture & lighting reasoning</li>
              <li>• Save iterations to your dashboard</li>
            </ul>
          </div>
          <BeforeAfterSlider before={sampleBefore} after={sampleAfter} className="aspect-[4/3]" />
        </div>
      </section>

      {/* MOODBOARD + WORKFLOW STRIP */}
      <section className="px-6 md:px-10 py-20 border-t border-border/60">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">An agent that thinks</p>
            <h3 className="font-display text-3xl">Understands first. Designs second.</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">SquareYards never blindly generates. It studies your room, your inspiration, your lifestyle and your budget — then explains every tradeoff.</p>
            <ul className="grid gap-2 pt-2 text-sm">
              <li className="flex items-center gap-2"><Layers className="h-4 w-4 text-accent" /> Multi-agent design generation</li>
              <li className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-accent" /> Vision-based room analysis</li>
              <li className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-accent" /> Budget-aware product picks</li>
            </ul>
          </div>
          <div className="md:col-span-2 grid grid-cols-3 gap-3">
            <img src={moodboard} alt="Moodboard" className="col-span-2 row-span-2 h-full w-full rounded-2xl object-cover" width={1280} height={1280} loading="lazy" />
            <img src={sampleBedroom} alt="Bedroom" className="h-full w-full rounded-2xl object-cover" width={1280} height={896} loading="lazy" />
            <img src={sampleKitchen} alt="Kitchen" className="h-full w-full rounded-2xl object-cover" width={1280} height={896} loading="lazy" />
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-12 border-t border-border/60 text-sm text-muted-foreground flex flex-wrap items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} SquareYards AI · Square your vision.</p>
        <div className="flex items-center gap-5">
          <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          <Link to="/auth" className="hover:text-foreground">Start a project</Link>
        </div>
      </footer>
    </div>
  );
}

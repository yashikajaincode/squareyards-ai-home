import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProjects } from "@/lib/projects.functions";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/intents";
import { ArrowRight, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/spaces")({
  head: () => ({ meta: [{ title: "My Spaces — SquareYards AI" }] }),
  component: Spaces,
});

function Spaces() {
  const fetchList = useServerFn(listProjects);
  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchList(),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="px-6 md:px-10 pb-24">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">My Spaces</p>
            <h1 className="font-display text-4xl md:text-5xl mt-2">Your design projects</h1>
          </div>
          <Link to="/new">
            <Button className="rounded-full"><Plus className="h-4 w-4 mr-1" /> New project</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Loading…</div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p: any) => (
              <Link
                key={p.id}
                to="/projects/$id"
                params={{ id: p.id }}
                className="group overflow-hidden rounded-2xl border border-border/70 bg-card transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="aspect-[5/4] bg-muted relative overflow-hidden">
                  {p.cover_url ? (
                    <img src={p.cover_url} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground text-sm">
                      {p.status === "options_ready" ? "Renders" : "Awaiting design"}
                    </div>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] uppercase tracking-wider">{p.intent}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-xl leading-tight">{p.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {p.room_type ?? "—"} · {p.style_preference ?? "Open style"}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 mt-1 text-muted-foreground transition group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatINR(p.budget_inr)}</span>
                    <span>{new Date(p.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
      <h2 className="font-display text-3xl">Your first space awaits.</h2>
      <p className="mt-2 text-muted-foreground">Tell us about the room — we'll design three concepts and render them photo-real.</p>
      <Link to="/new">
        <Button className="mt-6 rounded-full">Start a project</Button>
      </Link>
    </div>
  );
}

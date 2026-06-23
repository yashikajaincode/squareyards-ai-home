import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getProject, recordImage } from "@/lib/projects.functions";
import { analyzeRoom, generateOptions, generateRender } from "@/lib/ai.functions";
import { SiteNav } from "@/components/SiteNav";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Wand2, ImagePlus, IndianRupee, ChevronRight, Sparkles } from "lucide-react";
import { toast, Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/intents";
import sampleBefore from "@/assets/sample-before.jpg";
import sampleAfter from "@/assets/sample-after.jpg";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: () => ({ meta: [{ title: "Project — SquareYards AI" }] }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchProject = useServerFn(getProject);
  const recordImg = useServerFn(recordImage);
  const analyze = useServerFn(analyzeRoom);
  const gen = useServerFn(generateOptions);
  const render = useServerFn(generateRender);

  const [activeStep, setActiveStep] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => fetchProject({ data: { id } }),
    refetchInterval: busy ? 2500 : false,
  });

  const project = data?.project;
  const images = data?.images ?? [];
  const options = data?.options ?? [];

  useEffect(() => {
    if (!project) return;
    if (project.status === "draft" || project.status === "brief") setActiveStep(0);
    else if (project.status === "analyzed") setActiveStep(5);
    else if (project.status === "options_ready") setActiveStep(10);
  }, [project?.status]);


  async function onUpload(files: FileList | null) {
    if (!files || !files.length || !project) return;
    setBusy("uploading");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      for (const f of Array.from(files)) {
        const path = `${user.id}/${id}/${Date.now()}-${f.name}`;
        const up = await supabase.storage.from("project-images").upload(path, f, { upsert: true });
        if (up.error) throw up.error;
        const signed = await supabase.storage.from("project-images").createSignedUrl(path, 60 * 60 * 24 * 365);
        await recordImg({ data: {
          project_id: id, kind: "room",
          storage_path: path, public_url: signed.data?.signedUrl ?? "",
        }});
      }
      qc.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(null);
    }
  }

  async function runAnalyze() {
    if (!images.length) return toast.error("Upload at least one room photo first.");
    setBusy("analyzing");
    setActiveStep(3);
    try {
      await analyze({ data: { project_id: id, image_urls: images.map((i: any) => i.public_url).filter(Boolean).slice(0, 4) }});
      qc.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Room analyzed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analysis failed");
    } finally { setBusy(null); }
  }

  async function runGenerate() {
    setBusy("generating");
    setActiveStep(8);
    try {
      const { option_ids } = await gen({ data: { project_id: id }});
      setActiveStep(9);
      // generate render for each option (sequential to be safe)
      for (const oid of option_ids) {
        await render({ data: { option_id: oid, before_url: images[0]?.public_url ?? null } }).catch((e) => console.error(e));
      }
      qc.invalidateQueries({ queryKey: ["project", id] });
      toast.success("Designs ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Generation failed");
    } finally { setBusy(null); }
  }

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-background"><SiteNav /><div className="px-10 py-20 text-muted-foreground">Loading…</div></div>
    );
  }

  const a = (project.ai_analysis ?? null) as any;

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <SiteNav />
      <div className="px-6 md:px-10 pb-24">
        <Link to="/spaces" className="text-sm text-muted-foreground hover:text-foreground">← My Spaces</Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{project.intent} · {project.room_type ?? "—"}</p>
            <h1 className="font-display text-4xl md:text-5xl mt-1">{project.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />{formatINR(project.budget_inr)}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{project.style_preference ?? "Open"}</span>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[360px_1fr]">
          {/* SIDE: Workflow */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">AI Workflow</p>
              <div className="mt-4">
                <WorkflowTimeline active={activeStep} />
              </div>
            </div>
          </aside>

          {/* MAIN */}
          <main className="space-y-8">
            {/* Your space */}
            <section className="rounded-2xl border border-border/70 bg-card p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="font-display text-2xl">Your space</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {images.length
                      ? `${images.length} photo${images.length > 1 ? "s" : ""} uploaded. Analyze to read the room.`
                      : "Add a few photos of the room to unlock smarter designs."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => onUpload(e.target.files)} />
                  <Button variant="outline" onClick={() => fileRef.current?.click()} className="rounded-full">
                    <Upload className="h-4 w-4 mr-1" /> Add photos
                  </Button>
                  <Button onClick={runAnalyze} disabled={busy !== null || !images.length} className="rounded-full">
                    <Sparkles className="h-4 w-4 mr-1" />
                    {busy === "analyzing" ? "Analyzing…" : a ? "Re-analyze" : "Analyze space"}
                  </Button>
                </div>
              </div>
              {images.length > 0 && (
                <div className="mt-5 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {images.map((img: any) => (
                    <img key={img.id} src={img.public_url} alt="" className="aspect-square w-full rounded-lg object-cover border border-border/60" />
                  ))}
                </div>
              )}
              {a && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Stat label="Natural light" value={a.natural_light} />
                  <Stat label="Style detected" value={a.style_detected} />
                  <Stat label="Reusable items" value={(a.existing_furniture ?? []).filter((x: any) => x.reusable).length + " items"} />
                  <Stat label="Space efficiency" value={(a.space_efficiency_pct ?? 0) + "%"} />
                </div>
              )}
            </section>

            {/* Generate designs */}
            <section className="rounded-2xl border border-border/70 bg-card p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="font-display text-2xl">Generate design concepts</h2>
                  <p className="text-sm text-muted-foreground mt-1">Three options: Balanced, Budget Optimized, Premium — with real BOQ and photoreal renders.</p>
                </div>
                <Button onClick={runGenerate} disabled={busy !== null} className="rounded-full">
                  <Wand2 className="h-4 w-4 mr-1" />
                  {busy === "generating" ? "Designing…" : options.length ? "Regenerate" : "Generate 3 options"}
                </Button>
              </div>

              {options.length > 0 && (() => {
                // Group options by room_label (preserving order)
                const groups = new Map<string, any[]>();
                for (const o of options) {
                  const k = o.room_label ?? project.room_type ?? "Room";
                  if (!groups.has(k)) groups.set(k, []);
                  groups.get(k)!.push(o);
                }
                return (
                  <div className="mt-6 space-y-10">
                    {Array.from(groups.entries()).map(([roomLabel, opts]) => (
                      <div key={roomLabel}>
                        <div className="flex items-baseline justify-between mb-3">
                          <h3 className="font-display text-xl">{roomLabel}</h3>
                          <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{opts.length} concepts</span>
                        </div>
                        <Tabs defaultValue={opts[0].id}>
                          <TabsList className="bg-secondary/50 rounded-full p-1">
                            {opts.map((o: any) => (
                              <TabsTrigger key={o.id} value={o.id} className="rounded-full data-[state=active]:bg-walnut data-[state=active]:text-background">
                                {o.label}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {opts.map((o: any) => (
                            <TabsContent key={o.id} value={o.id} className="mt-6 space-y-6">
                              <OptionView option={o} boq={(data?.boq ?? []).filter((b: any) => b.option_id === o.id)} fallbackBefore={images[0]?.public_url ?? sampleBefore} sampleAfter={sampleAfter} />
                            </TabsContent>
                          ))}
                        </Tabs>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/60 p-4 min-w-0">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg leading-tight break-words" title={value ?? ""}>
        {value ?? "—"}
      </p>
    </div>
  );
}

function OptionView({ option, boq, fallbackBefore, sampleAfter }: { option: any; boq: any[]; fallbackBefore: string; sampleAfter: string }) {
  const after = option.after_url || sampleAfter;
  const before = option.before_url || fallbackBefore;
  const totalBoq = boq.reduce((s, b) => s + (b.unit_price_inr ?? 0) * b.qty, 0);
  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-2xl">
          <BeforeAfterSlider before={before} after={after} className="aspect-[4/3]" />
        </div>
        <div>
          <h3 className="font-display text-3xl">{option.concept_name}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{option.rationale}</p>
          {option.tradeoffs && (
            <p className="mt-3 text-xs text-muted-foreground"><span className="uppercase tracking-wider">Trade-offs · </span>{option.tradeoffs}</p>
          )}
        </div>
      </div>
      <div className="space-y-5">
        {/* Style DNA */}
        {(option.style_dna ?? []).length > 0 && (
          <Card title="Style DNA">
            <div className="space-y-2">
              {option.style_dna.map((s: any) => (
                <div key={s.style}>
                  <div className="flex justify-between text-xs text-muted-foreground"><span>{s.style}</span><span>{s.pct}%</span></div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-accent" style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        {(option.color_palette ?? []).length > 0 && (
          <Card title="Palette">
            <div className="flex flex-wrap gap-3">
              {option.color_palette.map((c: any) => (
                <div key={c.hex} className="text-center">
                  <div className="h-12 w-12 rounded-full border border-border" style={{ background: c.hex }} />
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{c.name}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
        <Card title="Bill of Quantities" right={<span className="text-sm font-display">{formatINR(totalBoq)}</span>}>
          {boq.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {boq.map((b: any) => (
                <li key={b.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm">{b.name}</div>
                    <div className="text-xs text-muted-foreground">{b.category}</div>
                  </div>
                  <div className="text-sm font-medium">{formatINR(b.unit_price_inr)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Confidence">
          <div className="flex items-center gap-3">
            <div className="font-display text-4xl">{option.confidence}%</div>
            <p className="text-xs text-muted-foreground">Based on brief clarity, room data, and catalog fit.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{title}</h4>
        {right}
      </div>
      {children}
    </div>
  );
}

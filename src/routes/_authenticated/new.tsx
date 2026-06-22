import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createProject } from "@/lib/projects.functions";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INTENTS, ROOM_TYPES, STYLES, BUDGET_BUCKETS } from "@/lib/intents";
import { ArrowRight, Check } from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({ meta: [{ title: "Start a project — SquareYards AI" }] }),
  component: NewProject,
});

function NewProject() {
  const router = useRouter();
  const create = useServerFn(createProject);

  const [step, setStep] = useState<1 | 2>(1);
  const [intent, setIntent] = useState<string>("");
  const [title, setTitle] = useState("");
  const [room, setRoom] = useState("Living Room");
  const [length, setLength] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [budget, setBudget] = useState<number | "">(500000);
  const [style, setStyle] = useState<string>("Scandinavian");
  const [lifestyle, setLifestyle] = useState("");
  const [musts, setMusts] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  function pickIntent(id: string) {
    setIntent(id);
    if (!title) setTitle(INTENTS.find((i) => i.id === id)?.title + " — " + room);
    setStep(2);
  }

  async function submit() {
    if (!intent) return setStep(1);
    setLoading(true);
    try {
      const { id } = await create({
        data: {
          title: title || "Untitled project",
          intent,
          room_type: room,
          length_cm: length ? parseInt(length) : null,
          width_cm: width ? parseInt(width) : null,
          budget_inr: typeof budget === "number" ? budget : null,
          style_preference: style,
          lifestyle, must_haves: musts, notes,
        },
      });
      router.navigate({ to: "/projects/$id", params: { id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create project");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <SiteNav />
      <div className="px-6 md:px-10 pb-24">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Start your project</p>
        <h1 className="font-display text-4xl md:text-5xl mt-2 max-w-3xl">{step === 1 ? "What are you designing?" : "Tell us about the space."}</h1>

        {step === 1 ? (
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {INTENTS.map((it, i) => (
              <button
                key={it.id}
                onClick={() => pickIntent(it.id)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-card p-5 text-left transition hover:border-walnut/40 hover:shadow-lg",
                  intent === it.id ? "border-walnut" : "border-border/70"
                )}
              >
                <div className="absolute right-4 top-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-6 font-display text-2xl leading-tight">{it.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{it.subtitle}</div>
                <div className="mt-6 text-xs text-muted-foreground/80">{it.hint}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-10 max-w-3xl space-y-8">
            <div>
              <Label>Project name</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="e.g. Sunlit living room in Bandra" />
            </div>

            <div>
              <Label>Room type</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ROOM_TYPES.map((r) => (
                  <Chip key={r} active={room === r} onClick={() => setRoom(r)}>{r}</Chip>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <Label>Length (cm) <span className="text-muted-foreground">optional</span></Label>
                <Input inputMode="numeric" value={length} onChange={(e) => setLength(e.target.value.replace(/\D/g, ""))} className="mt-1" placeholder="480" />
              </div>
              <div>
                <Label>Width (cm)</Label>
                <Input inputMode="numeric" value={width} onChange={(e) => setWidth(e.target.value.replace(/\D/g, ""))} className="mt-1" placeholder="360" />
              </div>
            </div>

            <div>
              <Label>Budget</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {BUDGET_BUCKETS.map((b) => (
                  <Chip key={b.value} active={budget === b.value} onClick={() => setBudget(b.value)}>{b.label}</Chip>
                ))}
                <Chip active={budget === ""} onClick={() => setBudget("")}>Flexible</Chip>
              </div>
            </div>

            <div>
              <Label>Style preference</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {STYLES.map((s) => (
                  <Chip key={s} active={style === s} onClick={() => setStyle(s)}>{s}</Chip>
                ))}
              </div>
            </div>

            <div>
              <Label>Lifestyle <span className="text-muted-foreground">how you live in this room</span></Label>
              <Textarea value={lifestyle} onChange={(e) => setLifestyle(e.target.value)} className="mt-1" placeholder="Couple, work from home, host on weekends, two cats…" rows={2} />
            </div>

            <div>
              <Label>Must-have furniture</Label>
              <Input value={musts} onChange={(e) => setMusts(e.target.value)} className="mt-1" placeholder="3-seater sofa, reading chair, TV unit" />
            </div>

            <div>
              <Label>Additional notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="South-facing, lots of natural light. Avoid bright reds." rows={3} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">Back</Button>
              <Button disabled={loading} onClick={submit} className="rounded-full">
                {loading ? "Creating…" : <>Continue<ArrowRight className="ml-1 h-4 w-4" /></>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm transition",
        active ? "border-walnut bg-walnut text-background" : "border-border bg-card text-foreground hover:border-walnut/40"
      )}
    >
      {active && <Check className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

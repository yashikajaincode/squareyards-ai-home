import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createProject } from "@/lib/projects.functions";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INTENTS, ROOM_TYPES, STYLES, formatINR } from "@/lib/intents";
import { ArrowRight, Check, Plus, X } from "lucide-react";
import { toast, Toaster } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/new")({
  head: () => ({ meta: [{ title: "Start a project — SquareYards AI" }] }),
  component: NewProject,
});

type RoomBrief = {
  room_type: string;
  length_cm: string;
  width_cm: string;
  budget_inr: number;
  style_preference: string;
  must_haves: string;
};

function emptyRoom(room_type: string, budget = 300000): RoomBrief {
  return { room_type, length_cm: "", width_cm: "", budget_inr: budget, style_preference: "Scandinavian", must_haves: "" };
}

function NewProject() {
  const router = useRouter();
  const create = useServerFn(createProject);

  const [step, setStep] = useState<1 | 2>(1);
  const [intent, setIntent] = useState<string>("");
  const [title, setTitle] = useState("");
  const [totalBudget, setTotalBudget] = useState<number>(1000000);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<RoomBrief[]>([]);
  const [lifestyle, setLifestyle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const allocated = useMemo(() => rooms.reduce((s, r) => s + (r.budget_inr || 0), 0), [rooms]);
  const remaining = totalBudget - allocated;

  function pickIntent(id: string) {
    setIntent(id);
    if (!title) setTitle(INTENTS.find((i) => i.id === id)?.title ?? "Untitled");
    setStep(2);
  }

  function toggleRoom(rt: string) {
    setSelectedRoomTypes((prev) => {
      const exists = prev.includes(rt);
      const next = exists ? prev.filter((r) => r !== rt) : [...prev, rt];
      // sync rooms
      setRooms((rs) => {
        if (exists) return rs.filter((r) => r.room_type !== rt);
        const evenSplit = next.length ? Math.floor(totalBudget / next.length) : 0;
        return [...rs, emptyRoom(rt, evenSplit)];
      });
      return next;
    });
  }

  function updateRoom(idx: number, patch: Partial<RoomBrief>) {
    setRooms((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  function distributeEvenly() {
    if (!rooms.length) return;
    const even = Math.floor(totalBudget / rooms.length);
    setRooms((rs) => rs.map((r) => ({ ...r, budget_inr: even })));
  }

  async function submit() {
    if (!intent) return setStep(1);
    if (!rooms.length) return toast.error("Add at least one room.");
    setLoading(true);
    try {
      const first = rooms[0];
      const { id } = await create({
        data: {
          title: title || "Untitled project",
          intent,
          // Backwards-compat summary fields (= first room)
          room_type: first.room_type,
          length_cm: first.length_cm ? parseInt(first.length_cm) : null,
          width_cm: first.width_cm ? parseInt(first.width_cm) : null,
          budget_inr: totalBudget,
          style_preference: first.style_preference,
          lifestyle,
          must_haves: rooms.map((r) => `${r.room_type}: ${r.must_haves}`).filter((s) => !s.endsWith(": ")).join(" | "),
          notes,
          rooms: rooms.map((r) => ({
            room_type: r.room_type,
            length_cm: r.length_cm ? parseInt(r.length_cm) : null,
            width_cm: r.width_cm ? parseInt(r.width_cm) : null,
            budget_inr: r.budget_inr || 0,
            style_preference: r.style_preference,
            must_haves: r.must_haves,
          })),
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
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Step {step} of 3 · Start your project
        </p>
        <h1 className="font-display text-4xl md:text-5xl mt-2 max-w-3xl">
          {step === 1 && "What are you designing?"}
          {step === 2 && "Which rooms, and what's your total budget?"}
          {step === 3 && "Tell us about each room."}
        </h1>

        {step === 1 && (
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
                <div className="absolute right-4 top-4 text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div className="mt-6 font-display text-2xl leading-tight">{it.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{it.subtitle}</div>
                <div className="mt-6 text-xs text-muted-foreground/80">{it.hint}</div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="mt-10 max-w-3xl space-y-8">
            <div>
              <Label>Project name</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" placeholder="e.g. Bandra 2BHK refresh" />
            </div>

            <div>
              <Label>Total budget across all rooms</Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  inputMode="numeric"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseInt(e.target.value.replace(/\D/g, "") || "0"))}
                  className="max-w-[200px]"
                />
                <span className="font-display text-xl text-muted-foreground">{formatINR(totalBudget)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {[300000, 500000, 1000000, 2000000, 5000000].map((v) => (
                  <Chip key={v} active={totalBudget === v} onClick={() => setTotalBudget(v)}>{formatINR(v)}</Chip>
                ))}
              </div>
            </div>

            <div>
              <Label>Rooms to design <span className="text-muted-foreground">pick one or more</span></Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ROOM_TYPES.map((r) => (
                  <Chip key={r} active={selectedRoomTypes.includes(r)} onClick={() => toggleRoom(r)}>{r}</Chip>
                ))}
              </div>
              {selectedRoomTypes.length > 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {selectedRoomTypes.length} room{selectedRoomTypes.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            <div>
              <Label>Lifestyle <span className="text-muted-foreground">applies across rooms</span></Label>
              <Textarea value={lifestyle} onChange={(e) => setLifestyle(e.target.value)} className="mt-1" placeholder="Couple, work from home, host on weekends, two cats…" rows={2} />
            </div>

            <div>
              <Label>Additional notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="South-facing, lots of natural light. Avoid bright reds." rows={2} />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full">Back</Button>
              <Button onClick={() => rooms.length ? setStep(3) : toast.error("Select at least one room")} className="rounded-full">
                Continue<ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-10 max-w-4xl space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card p-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Budget allocation</p>
                <p className="mt-1 font-display text-2xl">
                  {formatINR(allocated)} <span className="text-muted-foreground text-base">/ {formatINR(totalBudget)}</span>
                </p>
                <p className={cn("text-xs mt-1", remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
                  {remaining >= 0 ? `${formatINR(remaining)} remaining` : `Over by ${formatINR(-remaining)}`}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={distributeEvenly} className="rounded-full">Split evenly</Button>
            </div>

            {rooms.map((r, idx) => (
              <div key={r.room_type + idx} className="rounded-2xl border border-border/70 bg-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-2xl">{r.room_type}</h3>
                  <button
                    onClick={() => toggleRoom(r.room_type)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    aria-label="Remove room"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <div>
                    <Label>Length (cm) <span className="text-muted-foreground">optional</span></Label>
                    <Input inputMode="numeric" value={r.length_cm} onChange={(e) => updateRoom(idx, { length_cm: e.target.value.replace(/\D/g, "") })} className="mt-1" placeholder="480" />
                  </div>
                  <div>
                    <Label>Width (cm)</Label>
                    <Input inputMode="numeric" value={r.width_cm} onChange={(e) => updateRoom(idx, { width_cm: e.target.value.replace(/\D/g, "") })} className="mt-1" placeholder="360" />
                  </div>
                </div>

                <div>
                  <Label>Budget for this room</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Input
                      inputMode="numeric"
                      value={r.budget_inr}
                      onChange={(e) => updateRoom(idx, { budget_inr: parseInt(e.target.value.replace(/\D/g, "") || "0") })}
                      className="max-w-[180px]"
                    />
                    <span className="text-sm text-muted-foreground">{formatINR(r.budget_inr)}</span>
                  </div>
                </div>

                <div>
                  <Label>Style preference for {r.room_type}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STYLES.map((s) => (
                      <Chip key={s} active={r.style_preference === s} onClick={() => updateRoom(idx, { style_preference: s })}>{s}</Chip>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Must-have furniture</Label>
                  <Input value={r.must_haves} onChange={(e) => updateRoom(idx, { must_haves: e.target.value })} className="mt-1" placeholder="3-seater sofa, reading chair, TV unit" />
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Add another room:</span>
              {ROOM_TYPES.filter((rt) => !selectedRoomTypes.includes(rt)).map((rt) => (
                <button
                  key={rt}
                  onClick={() => toggleRoom(rt)}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs hover:border-walnut/40"
                >
                  <Plus className="h-3 w-3" /> {rt}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-full">Back</Button>
              <Button disabled={loading || !rooms.length} onClick={submit} className="rounded-full">
                {loading ? "Creating…" : <>Create project<ArrowRight className="ml-1 h-4 w-4" /></>}
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

import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCatalogStats, runEvals } from "@/lib/evals.functions";
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, FlaskConical, Database, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/evals")({
  head: () => ({
    meta: [
      { title: "Eval harness — SquareYards AI" },
      { name: "description", content: "Golden-set evaluation of the interior design agent: deterministic scorers, LLM judge, and ship gate." },
    ],
  }),
  component: EvalsPage,
});

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-walnut/15 bg-cream-100 p-4">
      <div className="text-xs uppercase tracking-wider text-walnut/60">{label}</div>
      <div className="mt-1 text-2xl font-serif text-walnut">{value}</div>
      {sub ? <div className="text-xs text-walnut/60 mt-0.5">{sub}</div> : null}
    </div>
  );
}

function GatePill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${ok ? "border-emerald-700/30 bg-emerald-50 text-emerald-900" : "border-red-700/30 bg-red-50 text-red-900"}`}>
      {ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
      <span>{label}</span>
    </div>
  );
}

function EvalsPage() {
  const stats = useQuery({ queryKey: ["catalogStats"], queryFn: () => getCatalogStats() });
  const run = useServerFn(runEvals);
  const [useLLM, setUseLLM] = useState(true);
  const [useJudge, setUseJudge] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => run({ data: { use_llm: useLLM, use_judge: useJudge } }),
  });

  const r = mutation.data;

  return (
    <div className="min-h-screen bg-cream">
      <SiteNav />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-2 text-walnut/70">
              <FlaskConical className="size-4" />
              <span className="text-xs uppercase tracking-[0.2em]">Evaluation harness</span>
            </div>
            <h1 className="mt-3 font-serif text-4xl text-walnut">Prove it works</h1>
            <p className="mt-2 max-w-2xl text-walnut/70">
              Golden-set of {(stats.data?.dataset_count ?? 0) + (stats.data?.adversarial_count ?? 0)} cases —
              {" "}{stats.data?.dataset_count ?? 0} from the uploaded catalog DB + {stats.data?.adversarial_count ?? 0} adversarial.
              Deterministic scorers for budget, catalog grounding, fit, must-have coverage, tool use and guardrails — plus an LLM-as-judge for style.
            </p>
          </div>
          <div className="rounded-2xl border border-walnut/15 bg-white px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-walnut/70"><Database className="size-4" /> Source of truth</div>
            <div className="mt-1 text-walnut">
              {stats.data ? `${stats.data.catalog_count} catalog items · ${stats.data.briefs_count} briefs · ${stats.data.in_stock} in stock` : "Loading…"}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 grid gap-3 sm:grid-cols-4">
          <Stat label="Cases" value={(stats.data?.dataset_count ?? 0) + (stats.data?.adversarial_count ?? 0)} sub="dataset + adversarial" />
          <Stat label="Deterministic scorers" value={9} sub="catalog, budget, fit, decline, brand, guarantee, infeasible, must-haves, in-stock" />
          <Stat label="Tool-use checks" value={3} sub="catalog_search · budget_calc · fit_check" />
          <Stat label="Judge" value="LLM" sub="style coherence 1–5" />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-walnut/80">
            <input type="checkbox" checked={useLLM} onChange={(e) => setUseLLM(e.target.checked)} /> Use LLM for selection (else greedy)
          </label>
          <label className="flex items-center gap-2 text-sm text-walnut/80">
            <input type="checkbox" checked={useJudge} onChange={(e) => setUseJudge(e.target.checked)} /> Run style judge
          </label>
          <button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-sm text-white hover:bg-terracotta/90 disabled:opacity-60"
          >
            {mutation.isPending ? <><Loader2 className="size-4 animate-spin" />Running…</> : "Run evals"}
          </button>
          {mutation.error ? <div className="text-sm text-red-700">Error: {(mutation.error as Error).message}</div> : null}
        </div>

        {/* Results */}
        {r ? (
          <div className="mt-10 space-y-8">
            {/* Ship gate */}
            <div className="rounded-2xl border border-walnut/15 bg-white p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-walnut/60">Ship gate</div>
                  <h2 className="mt-1 font-serif text-2xl text-walnut">
                    {r.ship ? "PASS — safe to ship" : "FAIL — do not ship"}
                  </h2>
                </div>
                <div className="text-right text-sm text-walnut/70">
                  Overall pass rate: <span className="text-walnut font-medium">{Math.round(r.pass_rate * 100)}%</span>
                  {r.judge_avg != null ? <> · Judge avg: <span className="text-walnut font-medium">{r.judge_avg.toFixed(2)}/5</span></> : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <GatePill ok={r.gate.items_in_catalog_100} label="100% real catalog items" />
                <GatePill ok={r.gate.within_budget_100} label="Never over budget" />
                <GatePill ok={r.gate.declined_100} label="Out-of-scope declined" />
                <GatePill ok={r.gate.fits_room_90} label="≥90% fit room" />
                <GatePill ok={r.gate.covers_must_haves_80} label="≥80% must-have coverage" />
                <GatePill ok={r.gate.style_judge_3_5} label="Judge ≥ 3.5/5" />
              </div>
            </div>

            {/* By metric */}
            <div className="rounded-2xl border border-walnut/15 bg-white p-6">
              <h3 className="font-serif text-xl text-walnut">By scorer</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(r.by_metric).map(([k, v]) => {
                  const pct = Math.round((v.pass / v.total) * 100);
                  return (
                    <div key={k} className="rounded-xl border border-walnut/10 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="font-medium text-walnut">{k}</div>
                        <div className={pct === 100 ? "text-emerald-700" : pct >= 80 ? "text-amber-700" : "text-red-700"}>{pct}%</div>
                      </div>
                      <div className="mt-1 text-xs text-walnut/60">{v.pass} / {v.total} passed</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-case */}
            <div className="rounded-2xl border border-walnut/15 bg-white p-6">
              <h3 className="font-serif text-xl text-walnut">Per-case results</h3>
              <div className="mt-4 divide-y divide-walnut/10">
                {r.results.map((res) => {
                  const failed = res.checks.filter((c) => !c.pass);
                  const isOpen = open === res.brief_id;
                  return (
                    <div key={res.brief_id} className="py-3">
                      <button
                        onClick={() => setOpen(isOpen ? null : res.brief_id)}
                        className="flex w-full items-center justify-between gap-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          {failed.length === 0
                            ? <CheckCircle2 className="size-4 text-emerald-700" />
                            : <XCircle className="size-4 text-red-700" />}
                          <span className="font-mono text-sm text-walnut">{res.brief_id}</span>
                          <span className="text-xs rounded-full border border-walnut/15 px-2 py-0.5 text-walnut/70">{res.source}</span>
                          <span className="text-sm text-walnut/70">
                            {res.plan.declined
                              ? "declined"
                              : `${res.plan.items.length} items · ₹${res.plan.total_inr.toLocaleString("en-IN")}/${res.plan.budget_inr.toLocaleString("en-IN")} · ${res.plan.fit.circulation_pct}% circ.`}
                          </span>
                          {res.judge ? <span className="text-xs text-walnut/60">judge {res.judge.score}/5</span> : null}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-walnut/60">
                          {res.checks.filter((c) => c.pass).length}/{res.checks.length} checks
                          <ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {isOpen ? (
                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase tracking-wider text-walnut/60">Checks</div>
                            <ul className="mt-2 space-y-1.5">
                              {res.checks.map((c) => (
                                <li key={c.name} className="flex items-start gap-2 text-sm">
                                  {c.pass
                                    ? <CheckCircle2 className="size-4 text-emerald-700 mt-0.5 shrink-0" />
                                    : <XCircle className="size-4 text-red-700 mt-0.5 shrink-0" />}
                                  <div>
                                    <span className="font-medium text-walnut">{c.name}</span>
                                    {c.detail ? <span className="text-walnut/60"> — {c.detail}</span> : null}
                                  </div>
                                </li>
                              ))}
                            </ul>

                            {res.plan.warnings.length ? (
                              <>
                                <div className="mt-4 text-xs uppercase tracking-wider text-walnut/60">Warnings</div>
                                <ul className="mt-2 space-y-1 text-sm text-walnut/80">
                                  {res.plan.warnings.map((w, i) => <li key={i}>• {w}</li>)}
                                </ul>
                              </>
                            ) : null}

                            {res.plan.decline_reasons.length ? (
                              <>
                                <div className="mt-4 text-xs uppercase tracking-wider text-walnut/60">Decline reasons</div>
                                <ul className="mt-2 space-y-1 text-sm text-walnut/80">
                                  {res.plan.decline_reasons.map((w, i) => <li key={i}>• {w}</li>)}
                                </ul>
                              </>
                            ) : null}

                            {res.judge ? (
                              <div className="mt-4 rounded-lg bg-cream-100 p-3 text-sm">
                                <div className="text-xs uppercase tracking-wider text-walnut/60">Style judge</div>
                                <div className="mt-1 text-walnut">{res.judge.score}/5 — {res.judge.reason}</div>
                              </div>
                            ) : null}
                          </div>

                          <div>
                            <div className="text-xs uppercase tracking-wider text-walnut/60">BOQ ({res.plan.items.length})</div>
                            <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-walnut/10">
                              <table className="w-full text-xs">
                                <thead className="bg-cream-100 text-walnut/70">
                                  <tr><th className="text-left p-2">ID</th><th className="text-left p-2">Item</th><th className="text-right p-2">₹</th><th className="text-right p-2">Stock</th></tr>
                                </thead>
                                <tbody>
                                  {res.plan.items.map((it) => (
                                    <tr key={it.item_id} className="border-t border-walnut/10">
                                      <td className="p-2 font-mono">{it.item_id}</td>
                                      <td className="p-2 text-walnut">{it.name} <span className="text-walnut/50">({it.category})</span></td>
                                      <td className="p-2 text-right">{it.price_inr.toLocaleString("en-IN")}</td>
                                      <td className="p-2 text-right">{it.in_stock === 1 ? "✓" : "✗"}</td>
                                    </tr>
                                  ))}
                                  {res.plan.items.length === 0 ? <tr><td colSpan={4} className="p-3 text-center text-walnut/60">No items selected</td></tr> : null}
                                </tbody>
                              </table>
                            </div>

                            <div className="mt-3 text-xs uppercase tracking-wider text-walnut/60">Tool log</div>
                            <ol className="mt-2 space-y-1 text-xs text-walnut/70 font-mono">
                              {res.plan.tool_log.map((t, i) => (
                                <li key={i}>{i + 1}. {t.tool}({Object.keys(t.input ?? {}).join(",")}) → {JSON.stringify(t.output).slice(0, 120)}</li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

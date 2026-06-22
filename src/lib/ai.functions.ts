import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";

async function gatewayJSON(body: unknown): Promise<any> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const r = await fetch(`${GATEWAY}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "raw-fetch",
    },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`AI gateway ${r.status}: ${text}`);
  return JSON.parse(text);
}

function extractJSON(s: string): any {
  // grab the largest {...} block
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("AI returned non-JSON: " + s.slice(0, 300));
  return JSON.parse(m[0]);
}

const AnalyzeInput = z.object({
  project_id: z.string().uuid(),
  image_urls: z.array(z.string().url()).min(1).max(4),
});

export const analyzeRoom = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AnalyzeInput.parse(d))
  .handler(async ({ data, context }) => {
    const proj = await context.supabase.from("projects").select("*").eq("id", data.project_id).single();
    if (proj.error) throw new Error(proj.error.message);

    const sys = `You are an expert interior designer analyzing user-submitted room photos. Return strict JSON only with keys:
{
 "natural_light": "Low|Medium|High",
 "existing_furniture": [{"item": string, "reusable": boolean}],
 "dominant_colors": [string],
 "style_detected": string,
 "space_efficiency_pct": number,
 "opportunities": [string],
 "constraints": [string]
}`;
    const userContent: any[] = [
      { type: "text", text: `Analyze these room photos for a ${proj.data.room_type ?? "room"} project. Goal: ${proj.data.intent}.` },
      ...data.image_urls.map((u) => ({ type: "image_url", image_url: { url: u } })),
    ];

    const res = await gatewayJSON({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: sys }, { role: "user", content: userContent }],
    });
    const content = res.choices?.[0]?.message?.content ?? "";
    const analysis = extractJSON(typeof content === "string" ? content : JSON.stringify(content));

    await context.supabase.from("projects")
      .update({ ai_analysis: analysis, status: "analyzed" })
      .eq("id", data.project_id);
    return analysis;
  });

const GenerateInput = z.object({ project_id: z.string().uuid() });

type CatalogRow = {
  item_id: string; category: string; name: string; style_tags: string | null;
  price_inr: number | null; color_finish: string | null; room_types: string | null;
};

export const generateOptions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateInput.parse(d))
  .handler(async ({ data, context }) => {
    const proj = await context.supabase.from("projects").select("*").eq("id", data.project_id).single();
    if (proj.error) throw new Error(proj.error.message);
    const p = proj.data;

    const catalog = await context.supabase
      .from("catalog")
      .select("item_id,category,name,style_tags,price_inr,color_finish,room_types")
      .ilike("room_types", `%${p.room_type ?? ""}%`);
    const items: CatalogRow[] = (catalog.data ?? []) as CatalogRow[];

    const sys = `You are a senior interior designer. Produce three distinct design options for the brief. Return STRICT JSON only:
{
 "options": [
  {
   "label": "Balanced"|"Budget Optimized"|"Premium",
   "concept_name": string,
   "rationale": string,
   "tradeoffs": string,
   "confidence": number,
   "style_dna": [{"style": string, "pct": number}],
   "color_palette": [{"name": string, "hex": string}],
   "materials": [string],
   "render_prompt": string,
   "boq_item_ids": [string]
  }
 ]
}
Rules:
- Use ONLY item_ids from the provided catalog for boq_item_ids.
- Balanced: ~budget. Budget Optimized: 0.6–0.75x budget. Premium: 1.1–1.5x budget.
- Each option boq must include core categories for the room.
- render_prompt: a vivid photo-real prompt of the redesigned room, warm neutral premium aesthetic, descriptive of furniture, color, light.
- style_dna percentages sum to 100.`;

    const user = `Brief:
intent: ${p.intent}
room: ${p.room_type ?? "n/a"}  size: ${p.length_cm ?? "?"}×${p.width_cm ?? "?"}cm
budget: ₹${p.budget_inr ?? "flexible"}
style: ${p.style_preference ?? "open"}
lifestyle: ${p.lifestyle ?? ""}
must_haves: ${p.must_haves ?? ""}
notes: ${p.notes ?? ""}
analysis: ${JSON.stringify(p.ai_analysis ?? {})}

Catalog (use item_id verbatim):
${items.map(i => `${i.item_id} | ${i.category} | ${i.name} | ₹${i.price_inr ?? "?"} | ${i.style_tags ?? ""} | ${i.color_finish ?? ""}`).join("\n")}`;

    const res = await gatewayJSON({
      model: "google/gemini-3-flash-preview",
      messages: [{ role: "system", content: sys }, { role: "user", content: user }],
    });
    const content = res.choices?.[0]?.message?.content ?? "";
    const parsed = extractJSON(typeof content === "string" ? content : JSON.stringify(content));

    const itemsById = new Map(items.map(i => [i.item_id, i]));
    const insertedIds: string[] = [];

    for (const opt of parsed.options ?? []) {
      const boqIds: string[] = Array.isArray(opt.boq_item_ids) ? opt.boq_item_ids.filter((id: any) => itemsById.has(id)) : [];
      const budgetUsed = boqIds.reduce((s, id) => s + (itemsById.get(id)?.price_inr ?? 0), 0);
      const { data: inserted, error } = await context.supabase.from("design_options").insert({
        project_id: data.project_id,
        user_id: context.userId,
        label: opt.label ?? "Balanced",
        concept_name: opt.concept_name ?? "Concept",
        rationale: opt.rationale ?? "",
        tradeoffs: opt.tradeoffs ?? "",
        confidence: Math.round(opt.confidence ?? 85),
        style_dna: opt.style_dna ?? [],
        color_palette: opt.color_palette ?? [],
        materials: opt.materials ?? [],
        budget_used: budgetUsed,
        moodboard_urls: [],
      }).select("id").single();
      if (error) throw new Error(error.message);
      insertedIds.push(inserted.id);

      // BOQ inserts
      const boqRows = boqIds.map(id => {
        const it = itemsById.get(id)!;
        return {
          option_id: inserted.id,
          user_id: context.userId,
          catalog_item_id: id,
          category: it.category,
          name: it.name,
          qty: 1,
          unit_price_inr: it.price_inr,
        };
      });
      if (boqRows.length) {
        await context.supabase.from("boq_items").insert(boqRows);
      }

      // Stash render prompt in ai_analysis-style field via materials append (hacky) - actually use rationale or store separately.
      // Use the moodboard_urls jsonb as ephemeral store.
      await context.supabase.from("design_options")
        .update({ moodboard_urls: { render_prompt: opt.render_prompt ?? "" } })
        .eq("id", inserted.id);
    }

    await context.supabase.from("projects")
      .update({ status: "options_ready" })
      .eq("id", data.project_id);

    return { option_ids: insertedIds };
  });

const RenderInput = z.object({
  option_id: z.string().uuid(),
  before_url: z.string().url().optional().nullable(),
});

export const generateRender = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RenderInput.parse(d))
  .handler(async ({ data, context }) => {
    const opt = await context.supabase.from("design_options").select("*").eq("id", data.option_id).single();
    if (opt.error) throw new Error(opt.error.message);
    const stashed: any = opt.data.moodboard_urls ?? {};
    const prompt = stashed.render_prompt ?? `Photoreal warm-neutral interior, premium ${opt.data.concept_name}, soft natural light, editorial photography.`;

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const r = await fetch(`${GATEWAY}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "raw-fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image",
        prompt: prompt + " Wide angle, photorealistic, magazine quality.",
      }),
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`Image gen ${r.status}: ${text.slice(0, 300)}`);
    const json = JSON.parse(text);
    const b64 = json?.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned");

    // Upload to storage
    const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const path = `${context.userId}/renders/${data.option_id}-${Date.now()}.png`;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const up = await supabaseAdmin.storage.from("project-images").upload(path, buf, {
      contentType: "image/png", upsert: true,
    });
    if (up.error) throw new Error(up.error.message);
    const signed = await supabaseAdmin.storage.from("project-images").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed.data?.signedUrl ?? "";

    await context.supabase.from("design_options").update({
      after_url: url,
      before_url: data.before_url ?? null,
    }).eq("id", data.option_id);

    return { url };
  });

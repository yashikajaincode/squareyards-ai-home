import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RoomSchema = z.object({
  room_type: z.string(),
  length_cm: z.number().int().nullable(),
  width_cm: z.number().int().nullable(),
  budget_inr: z.number().int(),
  style_preference: z.string(),
  must_haves: z.string().optional().default(""),
});

const CreateInput = z.object({
  title: z.string().min(1).max(120),
  intent: z.string().min(1),
  room_type: z.string().optional().nullable(),
  length_cm: z.number().int().optional().nullable(),
  width_cm: z.number().int().optional().nullable(),
  budget_inr: z.number().int().optional().nullable(),
  style_preference: z.string().optional().nullable(),
  lifestyle: z.string().optional().nullable(),
  must_haves: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  rooms: z.array(RoomSchema).optional().default([]),
});

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({ ...data, user_id: context.userId, status: "brief" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("id,title,intent,room_type,style_preference,budget_inr,status,cover_url,updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const project = await context.supabase
      .from("projects").select("*").eq("id", data.id).single();
    if (project.error) throw new Error(project.error.message);
    const images = await context.supabase
      .from("project_images").select("*").eq("project_id", data.id).order("created_at");
    const options = await context.supabase
      .from("design_options").select("*").eq("project_id", data.id).order("created_at");
    const boq = await context.supabase
      .from("boq_items").select("*").in("option_id", (options.data ?? []).map(o => o.id).length ? (options.data ?? []).map(o => o.id) : ["00000000-0000-0000-0000-000000000000"]);
    return {
      project: project.data,
      images: images.data ?? [],
      options: options.data ?? [],
      boq: boq.data ?? [],
    };
  });

export const recordImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    project_id: z.string().uuid(),
    kind: z.enum(["room", "inspiration", "floorplan"]),
    storage_path: z.string(),
    public_url: z.string().optional().nullable(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("project_images").insert({
      ...data, user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

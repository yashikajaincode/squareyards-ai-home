
-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile upsert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATALOG
CREATE TABLE public.catalog (
  item_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  style_tags TEXT,
  price_inr INTEGER,
  width_cm INTEGER,
  depth_cm INTEGER,
  height_cm INTEGER,
  color_finish TEXT,
  in_stock INTEGER,
  lead_time_days INTEGER,
  room_types TEXT
);
GRANT SELECT ON public.catalog TO authenticated, anon;
GRANT ALL ON public.catalog TO service_role;
ALTER TABLE public.catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "catalog public read" ON public.catalog FOR SELECT TO authenticated, anon USING (true);

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  intent TEXT NOT NULL,
  room_type TEXT,
  length_cm INTEGER,
  width_cm INTEGER,
  budget_inr INTEGER,
  style_preference TEXT,
  lifestyle TEXT,
  must_haves TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  cover_url TEXT,
  ai_analysis JSONB,
  workflow JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PROJECT IMAGES (uploaded room photos / inspirations)
CREATE TABLE public.project_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_images TO authenticated;
GRANT ALL ON public.project_images TO service_role;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own images" ON public.project_images FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- DESIGN OPTIONS (3 per project: balanced / budget / premium)
CREATE TABLE public.design_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  concept_name TEXT NOT NULL,
  rationale TEXT,
  style_dna JSONB,
  color_palette JSONB,
  materials JSONB,
  budget_used INTEGER,
  tradeoffs TEXT,
  confidence INTEGER,
  before_url TEXT,
  after_url TEXT,
  moodboard_urls JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.design_options TO authenticated;
GRANT ALL ON public.design_options TO service_role;
ALTER TABLE public.design_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own options" ON public.design_options FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- BOQ ITEMS
CREATE TABLE public.boq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id UUID NOT NULL REFERENCES public.design_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_item_id TEXT REFERENCES public.catalog(item_id),
  category TEXT,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price_inr INTEGER,
  note TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.boq_items TO authenticated;
GRANT ALL ON public.boq_items TO service_role;
ALTER TABLE public.boq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own boq" ON public.boq_items FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER projects_updated BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- STORAGE RLS for the private project-images bucket
CREATE POLICY "users read own folder" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users insert own folder" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users update own folder" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "users delete own folder" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-images' AND (storage.foldername(name))[1] = auth.uid()::text);

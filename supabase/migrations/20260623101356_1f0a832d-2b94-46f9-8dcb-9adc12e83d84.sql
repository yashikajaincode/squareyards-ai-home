CREATE TABLE public.room_briefs (
  brief_id text PRIMARY KEY,
  room_type text NOT NULL,
  length_cm integer,
  width_cm integer,
  ceiling_cm integer,
  budget_inr integer,
  style_preference text,
  must_haves text,
  constraints text,
  customer_note text
);
GRANT SELECT ON public.room_briefs TO anon, authenticated;
GRANT ALL ON public.room_briefs TO service_role;
ALTER TABLE public.room_briefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "briefs public read" ON public.room_briefs FOR SELECT USING (true);
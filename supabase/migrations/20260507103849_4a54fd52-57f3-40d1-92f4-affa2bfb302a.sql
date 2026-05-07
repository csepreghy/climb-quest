
-- Per-gender admin-managed level overrides. There are 10 fixed level slots.
CREATE TABLE public.level_overrides (
  level integer NOT NULL,
  gender text NOT NULL CHECK (gender IN ('male','female')),
  name text,
  tagline text,
  chalk_req integer,
  image text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (level, gender)
);

ALTER TABLE public.level_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Level overrides readable by everyone"
  ON public.level_overrides FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert level overrides"
  ON public.level_overrides FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update level overrides"
  ON public.level_overrides FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete level overrides"
  ON public.level_overrides FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER level_overrides_updated_at
  BEFORE UPDATE ON public.level_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for level character art
INSERT INTO storage.buckets (id, name, public)
VALUES ('level-images', 'level-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Level images publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'level-images');

CREATE POLICY "Admins can upload level images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'level-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update level images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'level-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete level images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'level-images' AND has_role(auth.uid(), 'admin'::app_role));

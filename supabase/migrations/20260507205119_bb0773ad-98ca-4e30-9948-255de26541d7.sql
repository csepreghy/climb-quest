
CREATE TABLE public.public_gyms (
  id text PRIMARY KEY,
  data jsonb NOT NULL,
  grading_systems jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.public_gyms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public gyms readable by everyone"
  ON public.public_gyms FOR SELECT USING (true);

CREATE POLICY "Admins can insert public gyms"
  ON public.public_gyms FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update public gyms"
  ON public.public_gyms FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete public gyms"
  ON public.public_gyms FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER public_gyms_set_updated_at
  BEFORE UPDATE ON public.public_gyms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

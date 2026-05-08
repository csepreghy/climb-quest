CREATE TABLE public.daily_cap_overrides (
  level integer PRIMARY KEY,
  cap integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.daily_cap_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily cap overrides readable by everyone"
  ON public.daily_cap_overrides FOR SELECT USING (true);

CREATE POLICY "Admins can insert daily cap overrides"
  ON public.daily_cap_overrides FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update daily cap overrides"
  ON public.daily_cap_overrides FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete daily cap overrides"
  ON public.daily_cap_overrides FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
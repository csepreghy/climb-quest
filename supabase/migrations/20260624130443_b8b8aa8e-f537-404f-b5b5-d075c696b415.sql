CREATE TABLE public.card_lab_settings (
  id integer PRIMARY KEY DEFAULT 1,
  config jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT card_lab_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.card_lab_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.card_lab_settings TO authenticated;
GRANT ALL ON public.card_lab_settings TO service_role;

ALTER TABLE public.card_lab_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read card lab settings"
  ON public.card_lab_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert card lab settings"
  ON public.card_lab_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update card lab settings"
  ON public.card_lab_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
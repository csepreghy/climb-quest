CREATE TABLE IF NOT EXISTS public.topo_settings (
  id integer PRIMARY KEY DEFAULT 1,
  config jsonb NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT topo_settings_singleton CHECK (id = 1)
);

GRANT SELECT ON public.topo_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.topo_settings TO authenticated;
GRANT ALL ON public.topo_settings TO service_role;

ALTER TABLE public.topo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topo_settings readable by all"
  ON public.topo_settings FOR SELECT
  USING (true);

CREATE POLICY "topo_settings admin insert"
  ON public.topo_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "topo_settings admin update"
  ON public.topo_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
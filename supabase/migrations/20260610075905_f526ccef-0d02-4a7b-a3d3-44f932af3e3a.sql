CREATE TABLE IF NOT EXISTS public.streak_config (
  id text PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT true,
  day_bonus_pcts jsonb NOT NULL DEFAULT '[10,10,10,10,10,10,50]'::jsonb,
  post7_chalk_pct integer NOT NULL DEFAULT 20,
  post7_chalk_days integer NOT NULL DEFAULT 3,
  post7_crit_pct integer NOT NULL DEFAULT 20,
  post7_crit_days integer NOT NULL DEFAULT 7,
  milestones jsonb NOT NULL DEFAULT '[
    {"day":14,"label":"Two-Week Tenacity","buffs":[{"kind":"chalk","pct":25,"days":5}]},
    {"day":21,"label":"Three-Week Titan","buffs":[{"kind":"cap","pct":50,"days":7}]},
    {"day":30,"label":"Monthly Monk","buffs":[{"kind":"chalk","pct":30,"days":7}],"chalkCacheMult":2.0}
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT ON public.streak_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.streak_config TO authenticated;
GRANT ALL ON public.streak_config TO service_role;

ALTER TABLE public.streak_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streak_config readable by all"
  ON public.streak_config FOR SELECT
  USING (true);

CREATE POLICY "streak_config writable by admins"
  ON public.streak_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.streak_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

CREATE TRIGGER streak_config_set_updated_at
  BEFORE UPDATE ON public.streak_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

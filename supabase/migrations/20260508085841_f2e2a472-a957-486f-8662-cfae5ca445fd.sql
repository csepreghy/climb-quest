CREATE TABLE public.daily_cap_config (
  id text NOT NULL PRIMARY KEY DEFAULT 'default',
  enabled boolean NOT NULL DEFAULT true,
  base integer NOT NULL DEFAULT 100,
  level_step integer NOT NULL DEFAULT 80,
  streak_step integer NOT NULL DEFAULT 25,
  streak_max_days integer NOT NULL DEFAULT 30,
  tier1_threshold numeric NOT NULL DEFAULT 1.0,
  tier1_mult numeric NOT NULL DEFAULT 0.5,
  tier2_threshold numeric NOT NULL DEFAULT 2.0,
  tier2_mult numeric NOT NULL DEFAULT 0.2,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.daily_cap_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily cap config readable by everyone"
  ON public.daily_cap_config FOR SELECT USING (true);

CREATE POLICY "Admins can insert daily cap config"
  ON public.daily_cap_config FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update daily cap config"
  ON public.daily_cap_config FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_daily_cap_config_updated_at
  BEFORE UPDATE ON public.daily_cap_config
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.daily_cap_config (id) VALUES ('default') ON CONFLICT DO NOTHING;
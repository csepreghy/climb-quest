CREATE TABLE public.activity_rewards (
  activity TEXT PRIMARY KEY,
  value INTEGER NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity rewards readable by everyone"
  ON public.activity_rewards FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert activity rewards"
  ON public.activity_rewards FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update activity rewards"
  ON public.activity_rewards FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete activity rewards"
  ON public.activity_rewards FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_activity_rewards_updated_at
  BEFORE UPDATE ON public.activity_rewards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
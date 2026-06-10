CREATE TABLE public.hangboard_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  board text NOT NULL DEFAULT 'beastmaker_1000',
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_template boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hangboard_workouts TO authenticated;
GRANT ALL ON public.hangboard_workouts TO service_role;

ALTER TABLE public.hangboard_workouts ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read templates or their own workouts
CREATE POLICY "Read templates and own workouts"
  ON public.hangboard_workouts FOR SELECT TO authenticated
  USING (is_template = true OR user_id = auth.uid());

-- Users insert their own workouts; admins may insert templates (user_id null allowed)
CREATE POLICY "Insert own workouts"
  ON public.hangboard_workouts FOR INSERT TO authenticated
  WITH CHECK (
    (user_id = auth.uid() AND is_template = false)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Update own or admin templates"
  ON public.hangboard_workouts FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Delete own or admin templates"
  ON public.hangboard_workouts FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER hangboard_workouts_set_updated_at
  BEFORE UPDATE ON public.hangboard_workouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX hangboard_workouts_user_idx ON public.hangboard_workouts(user_id);
CREATE INDEX hangboard_workouts_template_idx ON public.hangboard_workouts(is_template) WHERE is_template = true;
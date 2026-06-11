
CREATE TABLE public.hangboard_calibration (
  id text PRIMARY KEY DEFAULT 'default',
  holds jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

GRANT SELECT ON public.hangboard_calibration TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hangboard_calibration TO authenticated;
GRANT ALL ON public.hangboard_calibration TO service_role;

ALTER TABLE public.hangboard_calibration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read calibration"
  ON public.hangboard_calibration FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert calibration"
  ON public.hangboard_calibration FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update calibration"
  ON public.hangboard_calibration FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete calibration"
  ON public.hangboard_calibration FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

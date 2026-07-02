
CREATE TABLE public.badge_overrides (
  badge_id text PRIMARY KEY,
  title text,
  description text,
  rarity text,
  updated_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badge_overrides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.badge_overrides TO authenticated;
GRANT ALL ON public.badge_overrides TO service_role;
ALTER TABLE public.badge_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badge overrides readable by everyone" ON public.badge_overrides FOR SELECT USING (true);
CREATE POLICY "Admins can insert badge overrides" ON public.badge_overrides FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update badge overrides" ON public.badge_overrides FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete badge overrides" ON public.badge_overrides FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER badge_overrides_updated_at BEFORE UPDATE ON public.badge_overrides FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

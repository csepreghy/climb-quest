-- Shared shop catalog managed by admins
CREATE TABLE public.shop_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "group" TEXT NOT NULL,
  category TEXT NOT NULL,
  slot TEXT NOT NULL,
  rarity TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  bonus_pct NUMERIC NOT NULL DEFAULT 0,
  applies_to JSONB NOT NULL DEFAULT '"all"'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop items readable by everyone"
ON public.shop_items FOR SELECT
USING (true);

CREATE POLICY "Admins can insert shop items"
ON public.shop_items FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update shop items"
ON public.shop_items FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete shop items"
ON public.shop_items FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Built-in shop item ids hidden by admins (globally)
CREATE TABLE public.hidden_builtin_items (
  item_id TEXT PRIMARY KEY,
  hidden_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  hidden_by UUID
);

ALTER TABLE public.hidden_builtin_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hidden built-ins readable by everyone"
ON public.hidden_builtin_items FOR SELECT
USING (true);

CREATE POLICY "Admins can hide built-ins"
ON public.hidden_builtin_items FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can unhide built-ins"
ON public.hidden_builtin_items FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER shop_items_set_updated_at
BEFORE UPDATE ON public.shop_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hidden_builtin_items;
ALTER TABLE public.shop_items
ADD COLUMN IF NOT EXISTS gender text NOT NULL DEFAULT 'unisex'
CHECK (gender IN ('male','female','unisex'));
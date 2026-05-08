ALTER TABLE public.shop_items
  ADD COLUMN IF NOT EXISTS crit_chance_pct NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS boss_bonus_pct NUMERIC NOT NULL DEFAULT 0;

UPDATE public.shop_items
  SET slot = 'powerup', category = 'Power-up'
  WHERE "group" = 'power';
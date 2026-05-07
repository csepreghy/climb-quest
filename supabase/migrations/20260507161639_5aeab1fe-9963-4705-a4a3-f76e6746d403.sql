ALTER TABLE public.user_game_state
  ADD COLUMN slot text NOT NULL DEFAULT 'test'
  CHECK (slot IN ('test','personal'));

ALTER TABLE public.user_game_state DROP CONSTRAINT user_game_state_pkey;
ALTER TABLE public.user_game_state ADD PRIMARY KEY (user_id, slot);
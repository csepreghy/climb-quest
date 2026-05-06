
CREATE TABLE public.user_game_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  game jsonb NOT NULL DEFAULT '{}'::jsonb,
  gyms jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own game state"
  ON public.user_game_state FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own game state"
  ON public.user_game_state FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own game state"
  ON public.user_game_state FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER user_game_state_set_updated_at
  BEFORE UPDATE ON public.user_game_state
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

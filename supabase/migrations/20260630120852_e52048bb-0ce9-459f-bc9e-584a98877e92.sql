CREATE TABLE public.board_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at DATE NOT NULL DEFAULT CURRENT_DATE,
  board_type TEXT NOT NULL CHECK (board_type IN ('moonboard','kilter')),
  moonboard_variant TEXT,
  kilter_angle INT,
  problem_name TEXT,
  is_benchmark BOOLEAN NOT NULL DEFAULT false,
  is_flash BOOLEAN NOT NULL DEFAULT false,
  grade_system TEXT NOT NULL CHECK (grade_system IN ('v','french')),
  grade TEXT NOT NULL,
  grade_rank INT NOT NULL,
  chalk_awarded INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX board_sessions_user_logged_idx ON public.board_sessions(user_id, logged_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.board_sessions TO authenticated;
GRANT ALL ON public.board_sessions TO service_role;

ALTER TABLE public.board_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own board sessions"
  ON public.board_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own board sessions"
  ON public.board_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own board sessions"
  ON public.board_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own board sessions"
  ON public.board_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER board_sessions_set_updated_at
  BEFORE UPDATE ON public.board_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

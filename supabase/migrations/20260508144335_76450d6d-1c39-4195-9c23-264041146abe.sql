
-- Character name on profiles, case-insensitive unique
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS character_name TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_character_name_lower_idx
  ON public.profiles (LOWER(character_name))
  WHERE character_name IS NOT NULL;

-- Allow anyone authenticated to read names (needed for leaderboard joins are via SECURITY DEFINER, but kept simple)
-- (no policy change needed because we use SECURITY DEFINER functions below)

-- Set or change own character name
CREATE OR REPLACE FUNCTION public.set_character_name(p_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  cleaned := btrim(p_name);
  IF cleaned IS NULL OR length(cleaned) < 2 OR length(cleaned) > 24 THEN
    RAISE EXCEPTION 'Name must be 2-24 characters';
  END IF;
  IF cleaned !~ '^[A-Za-z0-9 _\-]+$' THEN
    RAISE EXCEPTION 'Only letters, numbers, spaces, _ and - allowed';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.profiles
    WHERE LOWER(character_name) = LOWER(cleaned) AND id <> auth.uid()
  ) THEN
    RAISE EXCEPTION 'Name is already taken';
  END IF;
  -- Ensure profile row exists
  INSERT INTO public.profiles (id, email, character_name)
  VALUES (auth.uid(), NULL, cleaned)
  ON CONFLICT (id) DO UPDATE SET character_name = EXCLUDED.character_name;
  RETURN cleaned;
END;
$$;

-- Check availability for live form feedback
CREATE OR REPLACE FUNCTION public.is_character_name_available(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT length(btrim(p_name)) >= 2
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles
       WHERE LOWER(character_name) = LOWER(btrim(p_name))
         AND (auth.uid() IS NULL OR id <> auth.uid())
     );
$$;

-- Leaderboard: excludes admin "test" slot, requires character_name
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  user_id UUID,
  character_name TEXT,
  level INT,
  total_chalk_earned BIGINT,
  total_logs INT,
  bosses_sent INT,
  owned JSONB,
  equipped JSONB,
  gender TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH eligible AS (
    SELECT
      ugs.user_id, ugs.slot, ugs.game,
      public.has_role(ugs.user_id, 'admin'::app_role) AS is_admin
    FROM public.user_game_state ugs
  ),
  filtered AS (
    SELECT * FROM eligible
    WHERE (is_admin AND slot = 'personal') OR (NOT is_admin AND slot = 'test')
  )
  SELECT
    f.user_id,
    p.character_name,
    COALESCE((f.game->>'level')::int, 1) AS level,
    COALESCE((f.game->>'totalChalkEarned')::bigint, 0) AS total_chalk_earned,
    COALESCE((f.game->'stats'->>'totalLogs')::int, 0) AS total_logs,
    COALESCE((f.game->'stats'->>'bossesSent')::int, 0) AS bosses_sent,
    COALESCE(f.game->'owned', '[]'::jsonb) AS owned,
    COALESCE(f.game->'equipped', '{}'::jsonb) AS equipped,
    COALESCE(f.game->>'gender', 'male') AS gender
  FROM filtered f
  JOIN public.profiles p ON p.id = f.user_id
  WHERE p.character_name IS NOT NULL
  ORDER BY total_chalk_earned DESC, level DESC;
$$;

-- Admin users overview
CREATE OR REPLACE FUNCTION public.get_admin_users()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  character_name TEXT,
  display_name TEXT,
  is_admin BOOLEAN,
  level INT,
  total_chalk_earned BIGINT,
  total_logs INT,
  bosses_sent INT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
  SELECT
    p.id,
    p.email,
    p.character_name,
    p.display_name,
    public.has_role(p.id, 'admin'::app_role),
    COALESCE((ugs.game->>'level')::int, 1),
    COALESCE((ugs.game->>'totalChalkEarned')::bigint, 0),
    COALESCE((ugs.game->'stats'->>'totalLogs')::int, 0),
    COALESCE((ugs.game->'stats'->>'bossesSent')::int, 0),
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_game_state ugs
    ON ugs.user_id = p.id
   AND ugs.slot = CASE WHEN public.has_role(p.id, 'admin'::app_role) THEN 'personal' ELSE 'test' END
  ORDER BY p.created_at DESC;
END;
$$;

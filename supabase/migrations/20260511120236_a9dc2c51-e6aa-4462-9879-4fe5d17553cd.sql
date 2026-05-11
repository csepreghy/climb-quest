
CREATE OR REPLACE FUNCTION public.get_climber_charts(target_user uuid)
RETURNS TABLE(logs jsonb, strength_sessions jsonb)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH chosen AS (
    SELECT ugs.game
    FROM public.user_game_state ugs
    WHERE ugs.user_id = target_user
      AND ugs.slot = CASE WHEN public.has_role(target_user, 'admin'::app_role) THEN 'personal' ELSE 'test' END
    LIMIT 1
  )
  SELECT
    COALESCE(c.game->'logs', '[]'::jsonb),
    COALESCE(c.game->'strengthSessions', '[]'::jsonb)
  FROM chosen c;
$$;

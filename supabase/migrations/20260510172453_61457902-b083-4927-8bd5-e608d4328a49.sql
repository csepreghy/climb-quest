DROP FUNCTION IF EXISTS public.get_leaderboard();
CREATE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, character_name text, level integer, total_chalk_earned bigint, total_logs integer, bosses_sent integer, strength_sessions integer, owned jsonb, equipped jsonb, gender text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH eligible AS (
    SELECT ugs.user_id, ugs.slot, ugs.game,
      public.has_role(ugs.user_id, 'admin'::app_role) AS is_admin
    FROM public.user_game_state ugs
  ),
  filtered AS (
    SELECT * FROM eligible
    WHERE (is_admin AND slot = 'personal') OR (NOT is_admin AND slot = 'test')
  )
  SELECT
    f.user_id,
    COALESCE(NULLIF(btrim(p.character_name), ''), 'Unnamed Climber'),
    COALESCE((f.game->>'level')::int, 1),
    COALESCE((f.game->>'totalChalkEarned')::bigint, 0),
    COALESCE((f.game->'stats'->>'totalLogs')::int, 0),
    COALESCE((f.game->'stats'->>'bossesSent')::int, 0),
    COALESCE(jsonb_array_length(f.game->'strengthSessions'), 0),
    COALESCE(f.game->'owned', '[]'::jsonb),
    COALESCE(f.game->'equipped', '{}'::jsonb),
    COALESCE(f.game->>'gender', 'male')
  FROM filtered f
  JOIN public.profiles p ON p.id = f.user_id
  ORDER BY 4 DESC, 3 DESC;
$function$;
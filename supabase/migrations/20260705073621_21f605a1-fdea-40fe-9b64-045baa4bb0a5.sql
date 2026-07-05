DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, character_name text, level integer, total_chalk_earned bigint, total_logs integer, bosses_sent integer, strength_reps integer, board_sessions integer, owned jsonb, equipped jsonb, gender text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    ugs.user_id,
    COALESCE(NULLIF(btrim(p.character_name), ''), 'Unnamed Climber'),
    COALESCE((ugs.game->>'level')::int, 1),
    COALESCE((ugs.game->>'totalChalkEarned')::bigint, 0),
    COALESCE((ugs.game->'stats'->>'totalLogs')::int, 0),
    COALESCE((ugs.game->'stats'->>'bossesSent')::int, 0),
    COALESCE((SELECT SUM((s->>'totalReps')::int) FROM jsonb_array_elements(ugs.game->'strengthSessions') AS s), 0),
    COALESCE((SELECT count(*)::int FROM public.board_sessions bs WHERE bs.user_id = ugs.user_id), 0),
    COALESCE(ugs.game->'owned', '[]'::jsonb),
    COALESCE(ugs.game->'equipped', '{}'::jsonb),
    COALESCE(ugs.game->>'gender', 'male')
  FROM public.user_game_state ugs
  JOIN public.profiles p ON p.id = ugs.user_id
  WHERE NOT public.has_role(ugs.user_id, 'admin'::app_role)
    AND p.archived_at IS NULL
  ORDER BY 4 DESC, 3 DESC;
$function$;
CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, character_name text, level integer, total_chalk_earned bigint, total_logs integer, bosses_sent integer, owned jsonb, equipped jsonb, gender text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    COALESCE(NULLIF(btrim(p.character_name), ''), 'Unnamed Climber') AS character_name,
    COALESCE((f.game->>'level')::int, 1) AS level,
    COALESCE((f.game->>'totalChalkEarned')::bigint, 0) AS total_chalk_earned,
    COALESCE((f.game->'stats'->>'totalLogs')::int, 0) AS total_logs,
    COALESCE((f.game->'stats'->>'bossesSent')::int, 0) AS bosses_sent,
    COALESCE(f.game->'owned', '[]'::jsonb) AS owned,
    COALESCE(f.game->'equipped', '{}'::jsonb) AS equipped,
    COALESCE(f.game->>'gender', 'male') AS gender
  FROM filtered f
  JOIN public.profiles p ON p.id = f.user_id
  ORDER BY total_chalk_earned DESC, level DESC;
$function$;
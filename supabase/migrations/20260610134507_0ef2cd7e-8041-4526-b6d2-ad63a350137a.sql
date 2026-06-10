
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS archived_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_user_archived(target_user uuid, archived boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  UPDATE public.profiles
     SET archived_at = CASE WHEN archived THEN now() ELSE NULL END
   WHERE id = target_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, character_name text, level integer, total_chalk_earned bigint, total_logs integer, bosses_sent integer, strength_sessions integer, owned jsonb, equipped jsonb, gender text)
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
    COALESCE(jsonb_array_length(ugs.game->'strengthSessions'), 0),
    COALESCE(ugs.game->'owned', '[]'::jsonb),
    COALESCE(ugs.game->'equipped', '{}'::jsonb),
    COALESCE(ugs.game->>'gender', 'male')
  FROM public.user_game_state ugs
  JOIN public.profiles p ON p.id = ugs.user_id
  WHERE NOT public.has_role(ugs.user_id, 'admin'::app_role)
    AND p.archived_at IS NULL
  ORDER BY 4 DESC, 3 DESC;
$function$;

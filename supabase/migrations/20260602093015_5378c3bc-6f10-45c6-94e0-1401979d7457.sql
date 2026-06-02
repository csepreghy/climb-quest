
DROP FUNCTION IF EXISTS public.get_admin_users();

CREATE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, email text, character_name text, display_name text, is_admin boolean, level integer, total_chalk_earned bigint, total_logs integer, bosses_sent integer, created_at timestamp with time zone, provider text, archived_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'admin only';
  END IF;
  RETURN QUERY
  SELECT
    p.id, p.email, p.character_name, p.display_name,
    public.has_role(p.id, 'admin'::app_role),
    COALESCE((ugs.game->>'level')::int, 1),
    COALESCE((ugs.game->>'totalChalkEarned')::bigint, 0),
    COALESCE((ugs.game->'stats'->>'totalLogs')::int, 0),
    COALESCE((ugs.game->'stats'->>'bossesSent')::int, 0),
    p.created_at,
    COALESCE(u.raw_app_meta_data->>'provider', 'email'),
    p.archived_at
  FROM public.profiles p
  LEFT JOIN public.user_game_state ugs ON ugs.user_id = p.id
  LEFT JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC;
END;
$function$;

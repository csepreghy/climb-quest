DROP FUNCTION IF EXISTS public.get_climber_charts(uuid);

CREATE OR REPLACE FUNCTION public.get_climber_charts(target_user uuid)
 RETURNS TABLE(logs jsonb, strength_sessions jsonb, board_sessions jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(ugs.game->'logs', '[]'::jsonb),
    COALESCE(ugs.game->'strengthSessions', '[]'::jsonb),
    COALESCE((
      SELECT jsonb_agg(to_jsonb(bs.*) ORDER BY bs.logged_at DESC, bs.created_at DESC)
      FROM public.board_sessions bs
      WHERE bs.user_id = target_user
    ), '[]'::jsonb)
  FROM public.user_game_state ugs
  WHERE ugs.user_id = target_user
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_climber_charts(uuid) TO authenticated, anon;
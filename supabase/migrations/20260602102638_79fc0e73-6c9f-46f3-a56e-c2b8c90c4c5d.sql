
-- Restrict user_roles SELECT to only the user's own role
DROP POLICY IF EXISTS "Roles readable by authenticated" ON public.user_roles;
CREATE POLICY "Users can read their own role"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Revoke EXECUTE on SECURITY DEFINER functions from anon (and PUBLIC where applicable)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_climber_charts(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_all_feedback() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_character_name(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_character_name_available(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_users() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- Keep authenticated execute for app-facing RPCs
GRANT EXECUTE ON FUNCTION public.get_climber_charts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_feedback() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_character_name(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_character_name_available(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

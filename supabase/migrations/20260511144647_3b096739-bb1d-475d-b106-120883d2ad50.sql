
-- Drop slot-based unique constraint, then drop slot column entirely.
-- After data was already migrated, only one row per user remains.
ALTER TABLE public.user_game_state DROP CONSTRAINT IF EXISTS user_game_state_user_id_slot_key;
ALTER TABLE public.user_game_state DROP CONSTRAINT IF EXISTS user_game_state_pkey;
-- Some installs may have a primary key; recreate on user_id alone.
ALTER TABLE public.user_game_state DROP COLUMN IF EXISTS slot;
ALTER TABLE public.user_game_state ADD CONSTRAINT user_game_state_pkey PRIMARY KEY (user_id);

-- Leaderboard: exclude admins, no slot filtering
CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(user_id uuid, character_name text, level integer, total_chalk_earned bigint, total_logs integer, bosses_sent integer, strength_sessions integer, owned jsonb, equipped jsonb, gender text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
  ORDER BY 4 DESC, 3 DESC;
$function$;

-- Admin users list: simple join, no slot
CREATE OR REPLACE FUNCTION public.get_admin_users()
 RETURNS TABLE(user_id uuid, email text, character_name text, display_name text, is_admin boolean, level integer, total_chalk_earned bigint, total_logs integer, bosses_sent integer, created_at timestamp with time zone)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
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
    p.created_at
  FROM public.profiles p
  LEFT JOIN public.user_game_state ugs ON ugs.user_id = p.id
  ORDER BY p.created_at DESC;
END;
$function$;

-- Climber charts: no slot
CREATE OR REPLACE FUNCTION public.get_climber_charts(target_user uuid)
 RETURNS TABLE(logs jsonb, strength_sessions jsonb)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    COALESCE(ugs.game->'logs', '[]'::jsonb),
    COALESCE(ugs.game->'strengthSessions', '[]'::jsonb)
  FROM public.user_game_state ugs
  WHERE ugs.user_id = target_user
  LIMIT 1;
$function$;

-- New-user trigger: andris788@gmail.com is the admin email going forward
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));

  if lower(new.email) = 'andris788@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  end if;
  return new;
end;
$function$;

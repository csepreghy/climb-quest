UPDATE public.user_game_state ugs
SET game = jsonb_set(
  game,
  '{stats,totalLogs}',
  to_jsonb(
    COALESCE((game->'stats'->>'totalLogs')::int, 0) +
    COALESCE((SELECT count(*)::int FROM public.board_sessions bs WHERE bs.user_id = ugs.user_id), 0)
  )
)
WHERE EXISTS (SELECT 1 FROM public.board_sessions bs WHERE bs.user_id = ugs.user_id);
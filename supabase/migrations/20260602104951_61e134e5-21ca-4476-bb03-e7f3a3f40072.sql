-- Re-grant anon EXECUTE on get_leaderboard so n8n can fetch leaderboard data
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon;
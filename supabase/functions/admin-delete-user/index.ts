// Admin-only: delete a user account and all associated app data.
// Verifies the caller is an admin via their JWT, then uses the service role
// to delete app rows + the auth user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "missing auth" }, 401);

    // Caller client (uses their JWT) — to verify they're an admin.
    const caller = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await caller.auth.getUser();
    if (userErr || !userData.user) return json({ error: "not authenticated" }, 401);

    const callerId = userData.user.id;
    const { data: isAdmin, error: roleErr } = await caller.rpc("has_role", {
      _user_id: callerId,
      _role: "admin",
    });
    if (roleErr || !isAdmin) return json({ error: "admin only" }, 403);

    const body = await req.json().catch(() => ({}));
    const targetId = body?.user_id as string | undefined;
    if (!targetId) return json({ error: "user_id required" }, 400);
    if (targetId === callerId) return json({ error: "cannot delete yourself" }, 400);

    // Service-role client — bypasses RLS for the actual deletion.
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Delete app data first, then the auth user.
    const tables = ["feedback", "user_game_state", "user_roles", "profiles"];
    for (const t of tables) {
      const { error } = await admin.from(t).delete().eq(
        t === "user_roles" || t === "user_game_state" || t === "feedback" ? "user_id" : "id",
        targetId,
      );
      if (error) console.warn(`[admin-delete-user] failed to clear ${t}:`, error.message);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(targetId);
    if (delErr) return json({ error: "auth delete failed: " + delErr.message }, 500);

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

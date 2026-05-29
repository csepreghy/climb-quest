import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-n8n-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface IncomingBody {
  user_id?: string;
  audience?: string;
  type?: string;
  source?: string;
  title?: string;
  body?: string;
  highlights?: string[];
  action_label?: string;
  action_url?: string;
  payload?: Record<string, unknown>;
  priority?: string;
  starts_at?: string;
  expires_at?: string;
  // raw n8n shape
  output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
}

function tryParseRawN8n(body: IncomingBody): IncomingBody | null {
  const text = body?.output?.[0]?.content?.[0]?.text;
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    return {
      user_id: body.user_id,
      audience: "user",
      type: body.type || "weekly_recap",
      source: body.source || "n8n",
      title: parsed.title ?? "Weekly Recap",
      body: parsed.summary ?? "",
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      payload: {
        ...(body.payload ?? {}),
        ...parsed,
        next_quest: parsed.next_quest,
      },
      priority: "normal",
    };
  } catch (_) {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const expected = Deno.env.get("N8N_NOTIFICATIONS_SECRET");
  if (!expected) return json({ error: "server misconfigured" }, 500);
  const provided = req.headers.get("x-n8n-secret");
  if (!provided || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  let raw: IncomingBody;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  // Normalize: if raw n8n output array is present, parse it.
  const normalized = raw.output ? tryParseRawN8n(raw) ?? raw : raw;

  if (!normalized.title || !normalized.body) {
    return json({ error: "title and body are required" }, 400);
  }
  if (!normalized.user_id && (normalized.audience ?? "user") === "user") {
    return json({ error: "user_id required when audience is 'user'" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // De-dupe weekly recaps for the same period
  const period_start = (normalized.payload as any)?.period_start;
  const period_end = (normalized.payload as any)?.period_end;
  if (
    normalized.type === "weekly_recap" &&
    normalized.user_id &&
    period_start &&
    period_end
  ) {
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("user_id", normalized.user_id)
      .eq("type", "weekly_recap")
      .filter("payload->>period_start", "eq", String(period_start))
      .filter("payload->>period_end", "eq", String(period_end))
      .limit(1);
    if (existing && existing.length > 0) {
      return json({ ok: true, deduped: true, id: existing[0].id });
    }
  }

  const insertRow = {
    user_id: normalized.user_id ?? null,
    audience: normalized.audience ?? "user",
    type: normalized.type ?? "system",
    source: normalized.source ?? "n8n",
    title: normalized.title,
    body: normalized.body,
    highlights: normalized.highlights ?? [],
    action_label: normalized.action_label ?? null,
    action_url: normalized.action_url ?? null,
    payload: normalized.payload ?? {},
    priority: normalized.priority ?? "normal",
    starts_at: normalized.starts_at ?? null,
    expires_at: normalized.expires_at ?? null,
  };

  const { data, error } = await supabase
    .from("notifications")
    .insert(insertRow)
    .select("id")
    .single();

  if (error) return json({ error: error.message }, 500);
  return json({ ok: true, id: data.id });
});

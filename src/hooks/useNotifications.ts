import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface NotificationRow {
  id: string;
  user_id: string | null;
  audience: string;
  type: string;
  source: string;
  title: string;
  body: string;
  highlights: string[] | null;
  action_label: string | null;
  action_url: string | null;
  payload: Record<string, any> | null;
  priority: string;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface NotificationReadRow {
  notification_id: string;
  seen_at: string | null;
  dismissed_at: string | null;
}

export interface NotificationView extends NotificationRow {
  seen_at: string | null;
  dismissed_at: string | null;
  unread: boolean;
}

function isActive(n: NotificationRow): boolean {
  const now = Date.now();
  if (n.starts_at && new Date(n.starts_at).getTime() > now) return false;
  if (n.expires_at && new Date(n.expires_at).getTime() <= now) return false;
  return true;
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [reads, setReads] = useState<Record<string, NotificationReadRow>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setItems([]);
      setReads({});
      return;
    }
    setLoading(true);
    const [{ data: notifs }, { data: rds }] = await Promise.all([
      supabase
        .from("notifications" as any)
        .select("*")
        .or(`user_id.eq.${user.id},and(audience.eq.all,user_id.is.null)`)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("notification_reads" as any)
        .select("notification_id, seen_at, dismissed_at")
        .eq("user_id", user.id),
    ]);
    setItems(((notifs as any) ?? []) as NotificationRow[]);
    const map: Record<string, NotificationReadRow> = {};
    for (const r of (rds as any) ?? []) map[r.notification_id] = r;
    setReads(map);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Realtime: refetch on changes
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("notifications-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => fetchAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_reads", filter: `user_id=eq.${user.id}` },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, fetchAll]);

  const view = useMemo<NotificationView[]>(() => {
    return items
      .filter(isActive)
      .map((n) => {
        const r = reads[n.id];
        return {
          ...n,
          seen_at: r?.seen_at ?? null,
          dismissed_at: r?.dismissed_at ?? null,
          unread: !r?.seen_at,
        };
      })
      .filter((n) => !n.dismissed_at);
  }, [items, reads]);

  const unread = view.filter((n) => n.unread);
  const read = view.filter((n) => !n.unread);
  const list = [...unread, ...read.slice(0, 3)];
  const unreadCount = unread.length;

  const markSeen = useCallback(
    async (id: string) => {
      if (!user) return;
      const existing = reads[id];
      if (existing?.seen_at) return;
      // optimistic
      setReads((p) => ({
        ...p,
        [id]: { notification_id: id, seen_at: new Date().toISOString(), dismissed_at: existing?.dismissed_at ?? null },
      }));
      await supabase.from("notification_reads" as any).upsert(
        {
          notification_id: id,
          user_id: user.id,
          seen_at: new Date().toISOString(),
        },
        { onConflict: "notification_id,user_id" },
      );
    },
    [user, reads],
  );

  const dismiss = useCallback(
    async (id: string) => {
      if (!user) return;
      const now = new Date().toISOString();
      setReads((p) => ({
        ...p,
        [id]: {
          notification_id: id,
          seen_at: p[id]?.seen_at ?? now,
          dismissed_at: now,
        },
      }));
      await supabase.from("notification_reads" as any).upsert(
        {
          notification_id: id,
          user_id: user.id,
          seen_at: reads[id]?.seen_at ?? now,
          dismissed_at: now,
        },
        { onConflict: "notification_id,user_id" },
      );
    },
    [user, reads],
  );

  return { list, unread, unreadCount, loading, markSeen, dismiss, refetch: fetchAll, all: view };
}

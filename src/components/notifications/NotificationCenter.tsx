import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { GameButton } from "@/components/ui/game-button";
import { cn } from "@/lib/utils";
import { useNotifications, type NotificationView } from "@/hooks/useNotifications";

function typeLabel(t: string) {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function fmtDate(d: string) {
  const dt = new Date(d);
  return dt.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function truncate(s: string, n = 110) {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

export function NotificationCenter() {
  const { list, unreadCount, unread, markSeen, dismiss } = useNotifications();
  const [listOpen, setListOpen] = useState(false);
  const [active, setActive] = useState<NotificationView | null>(null);
  const [autoShownIds, setAutoShownIds] = useState<Set<string>>(new Set());
  const nav = useNavigate();

  // Auto-pop the most recent unread high-priority or weekly_recap once per session
  const autoCandidate = useMemo(
    () =>
      unread.find(
        (n) =>
          !autoShownIds.has(n.id) && (n.priority === "high" || n.type === "weekly_recap"),
      ) ?? null,
    [unread, autoShownIds],
  );

  useEffect(() => {
    if (autoCandidate && !active) {
      setAutoShownIds((p) => new Set(p).add(autoCandidate.id));
      open(autoCandidate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCandidate]);

  function open(n: NotificationView) {
    setActive(n);
    if (n.unread) markSeen(n.id);
  }

  async function onDismiss() {
    if (!active) return;
    await dismiss(active.id);
    setActive(null);
  }

  function onAction() {
    if (!active?.action_url) return;
    const url = active.action_url;
    setActive(null);
    if (url.startsWith("/")) nav(url);
    else window.open(url, "_blank", "noopener,noreferrer");
  }

  const nextQuest = (active?.payload as any)?.next_quest as string | undefined;

  return (
    <>
      <button
        type="button"
        onClick={() => setListOpen(true)}
        aria-label="Notifications"
        className="relative flex items-center justify-center h-10 w-10 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary hover:brightness-110 transition shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06),inset_0_-1px_0_hsl(0_0%_0%/0.55)]"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[hsl(var(--btn-orange))] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[hsl(var(--panel-frame))]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* List dialog */}
      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Notifications
            </DialogTitle>
            <DialogDescription>
              {unreadCount > 0
                ? `${unreadCount} unread ${unreadCount === 1 ? "update" : "updates"}`
                : "You're all caught up."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {list.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8">
                No notifications yet.
              </div>
            )}
            {list.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setListOpen(false);
                  open(n);
                }}
                className={cn(
                  "w-full text-left rounded-lg border-2 border-[hsl(var(--panel-frame))] px-3 py-2.5 transition hover:brightness-110",
                  n.unread
                    ? "bg-[hsl(var(--btn-orange))]/15 ring-1 ring-[hsl(var(--btn-orange))]/40"
                    : "bg-secondary/60 opacity-80",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {typeLabel(n.type)}
                  </span>
                  {n.unread && (
                    <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--btn-orange))] font-bold">
                      New
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm mt-0.5">{n.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {truncate(n.body)}
                </div>
                <div className="text-[10px] text-muted-foreground/70 mt-1">
                  {fmtDate(n.created_at)}
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-lg">
          {active && (
            <>
              <DialogHeader>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  {typeLabel(active.type)} · {fmtDate(active.created_at)}
                </div>
                <DialogTitle>{active.title}</DialogTitle>
                <DialogDescription className="whitespace-pre-wrap text-foreground/85">
                  {active.body}
                </DialogDescription>
              </DialogHeader>

              {active.highlights && active.highlights.length > 0 && (
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="menu-label mb-2">Highlights</div>
                  <ul className="space-y-1 text-sm">
                    {active.highlights.map((h, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-[hsl(var(--btn-orange))]">▸</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {nextQuest && (
                <div className="rounded-lg border-2 border-[hsl(var(--btn-orange))]/60 bg-[hsl(var(--btn-orange))]/10 p-3">
                  <div className="menu-label mb-1 text-[hsl(var(--btn-orange))]">
                    Next Quest
                  </div>
                  <div className="text-sm">{nextQuest}</div>
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-2">
                {active.action_label && active.action_url && (
                  <GameButton variant="primary" size="sm" onClick={onAction}>
                    {active.action_label}
                  </GameButton>
                )}
                <GameButton variant="ghost" size="sm" onClick={onDismiss}>
                  Nice!
                </GameButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

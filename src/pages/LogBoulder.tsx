import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame, deleteLog, deleteStrengthSession, BoulderLog } from "@/game/store";
import { ACTIVITY_LABELS } from "@/game/data";
import { useAllGyms as useGyms } from "@/game/allGyms";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogModal } from "@/components/LogModal";
import { DailyCapBar } from "@/components/DailyCapBar";
import { Plus, Swords, Sparkles, Filter, Pencil, Trash2, Dumbbell, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import Hangboard from "@/pages/Hangboard";
import { useBoardSessions, deleteBoardSession } from "@/game/board/store";
import { boardLabel, type BoardSessionRow } from "@/game/board/types";
import { gradeRank } from "@/game/board/grades";
import moonboardAsset from "@/assets/board-moonboard.png.asset.json";
import kilterAsset from "@/assets/board-kilter.png.asset.json";

type EntryFilter = "all" | "boulder" | "boss";
type Tab = "boulders" | "strength" | "hangboard" | "board";


export default function BoulderLogs() {
  const s = useGame();
  const { gyms } = useGyms();
  const nav = useNavigate();
  const [tab, setTab] = useState<Tab>("boulders");
  const [open, setOpen] = useState(false);
  const [editLog, setEditLog] = useState<BoulderLog | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteStrengthId, setDeleteStrengthId] = useState<string | null>(null);
  const [deleteBoardId, setDeleteBoardId] = useState<string | null>(null);
  const [editBoardSession, setEditBoardSession] = useState<BoardSessionRow | null>(null);
  const { sessions: boardSessions, refresh: refreshBoards } = useBoardSessions();
  const [entryFilter, setEntryFilter] = useState<EntryFilter>("all");
  const [grade, setGrade] = useState<string>("all");
  const [gymId, setGymId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [visible, setVisible] = useState(10);

  const grades = useMemo(() => {
    const set = new Set<string>();
    s.logs.forEach(l => l.grade && set.add(l.grade));
    return Array.from(set).sort();
  }, [s.logs]);

  const filtered = useMemo(() => s.logs.filter(l => {
    if (entryFilter === "boulder" && l.isBoss) return false;
    if (entryFilter === "boss" && !l.isBoss) return false;
    if (grade !== "all" && l.grade !== grade) return false;
    if (gymId !== "all" && l.gymId !== gymId) return false;
    if (search) {
      const hay = [l.location, l.notes, l.grade, ...l.styles].filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  }), [s.logs, entryFilter, grade, gymId, search]);

  useEffect(() => { setVisible(10); }, [entryFilter, grade, gymId, search, tab]);
  const shown = filtered.slice(0, visible);
  const strengthSessions = s.strengthSessions ?? [];

  return (
    <div className="space-y-5 animate-float-up">
      <LogModal
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) { setEditLog(null); void refreshBoards(); } }}
        editLog={editLog}
        initialMode={tab === "board" ? "board" : undefined}
      />

      <AlertDialog open={!!deleteBoardId} onOpenChange={(v) => { if (!v) setDeleteBoardId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this board climb?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the session from your history. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteBoardId) {
                  try { await deleteBoardSession(deleteBoardId); await refreshBoards(); toast.success("Board climb deleted"); }
                  catch { toast.error("Failed to delete"); }
                }
                setDeleteBoardId(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this log?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the log and refunds the chalk it earned. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) { deleteLog(deleteId); toast.success("Log deleted"); }
                setDeleteId(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteStrengthId} onOpenChange={(v) => { if (!v) setDeleteStrengthId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this strength session?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the session from your history. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteStrengthId) { deleteStrengthSession(deleteStrengthId); toast.success("Session deleted"); }
                setDeleteStrengthId(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Logs</h1>
          <p className="text-sm text-muted-foreground">Every problem, project and rep you've logged.</p>
        </div>
        {tab === "hangboard" ? (
          <GameButton variant="success" onClick={() => nav("/hangboard/new")}>
            <Plus className="h-4 w-4" /> New workout
          </GameButton>
        ) : (
          <GameButton variant="success" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Log
          </GameButton>
        )}
      </div>

      {tab !== "hangboard" && <DailyCapBar />}

      {/* Tab selector */}
      <div className="flex gap-1 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary/40 p-1 w-fit">
        {([
          { v: "boulders", label: "Boulders", icon: Sparkles },
          { v: "strength", label: "Strength", icon: Dumbbell },
          { v: "board", label: "Board", icon: Mountain },
          { v: "hangboard", label: "Hangboard", icon: Dumbbell },

        ] as { v: Tab; label: string; icon: typeof Sparkles }[]).map(t => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition",
              tab === t.v
                ? "bg-[hsl(var(--btn-orange))] text-white shadow-[inset_0_2px_0_hsl(0_0%_100%/0.25)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "boulders" ? (

        <>
          <GameCard className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> Filters
              </div>
              <div className="flex gap-1">
                {(["all","boulder","boss"] as EntryFilter[]).map(f => (
                  <button key={f} onClick={() => setEntryFilter(f)}
                    className={cn("text-xs px-3 py-1.5 rounded-full border capitalize",
                      entryFilter === f
                        ? "bg-[hsl(var(--btn-orange))] border-[hsl(var(--btn-orange))] text-white"
                        : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground")}>
                    {f === "all" ? "All" : f === "boss" ? "Bosses" : "Boulders"}
                  </button>
                ))}
              </div>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue placeholder="Grade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
                  {grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              {gyms.length > 1 && (
                <Select value={gymId} onValueChange={setGymId}>
                  <SelectTrigger className="w-[160px] h-9 text-xs"><SelectValue placeholder="Gym" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All gyms</SelectItem>
                    {gyms.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes / styles…"
                className="h-9 text-xs flex-1 min-w-[160px]" />
            </div>
          </GameCard>

          <GameCard className="p-0 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-sm text-muted-foreground py-12 text-center">
                <p className="text-3xl mb-2">🪨</p>
                {s.logs.length === 0 ? "No logs yet. Send something!" : "No logs match these filters."}
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {shown.map(l => {
                  const isBoss = !!l.isBoss;
                  const hold = l.gymId && l.holdColorId
                    ? gyms.find(g => g.id === l.gymId)?.holdColors.find(c => c.id === l.holdColorId)
                    : null;
                  return (
                    <div key={l.id}
                      className={cn("px-4 py-3 flex items-center justify-between gap-3",
                        isBoss && "bg-boss/5 border-l-4 border-boss")}>
                      <div className="min-w-0 flex items-center gap-3">
                        {hold ? (
                          <div
                            title={`${hold.name} hold`}
                            aria-label={`${hold.name} hold`}
                            className="h-9 w-9 rounded-full shrink-0 border-2 border-border"
                            style={{ background: hold.hex2 ? `linear-gradient(90deg, ${hold.hex} 0 50%, ${hold.hex2} 50% 100%)` : hold.hex }}
                          />
                        ) : (
                          <div className={cn("h-9 w-9 grid place-items-center rounded-lg shrink-0",
                            isBoss ? "bg-boss/20 text-boss" : "bg-secondary text-foreground/70")}>
                            {isBoss ? <Swords className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate flex items-center gap-2">
                            {ACTIVITY_LABELS[l.activity] ?? "Boulder"}
                            {isBoss && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-boss/20 text-boss border border-boss/40">Boss</span>}
                            {l.attemptType && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{l.attemptType}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {new Date(l.date).toLocaleDateString()}
                            {l.grade ? ` · ${l.grade}${l.gradeMax ? `–${l.gradeMax}` : ""}` : ""}
                            {l.location ? ` · ${l.location}` : ""}
                            {l.styles.length ? ` · ${l.styles.slice(0,3).join(", ")}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold tabular-nums gradient-chalk-text">+{l.chalkTotal}</div>
                          {l.chalkBonus > 0 && <div className="text-[10px] text-muted-foreground">+{l.chalkBonus} bonus</div>}
                        </div>
                        <button
                          onClick={() => { setEditLog(l); setOpen(true); }}
                          aria-label="Edit log"
                          className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(l.id)}
                          aria-label="Delete log"
                          className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length > visible && (
                  <div className="p-3 text-center">
                    <GameButton variant="ghost" size="sm" onClick={() => setVisible(v => v + 10)}>
                      Load more ({filtered.length - visible} remaining)
                    </GameButton>
                  </div>
                )}
              </div>
            )}
          </GameCard>
        </>
      ) : tab === "strength" ? (
        <GameCard className="p-0 overflow-hidden">
          {strengthSessions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-60" />
              No strength sessions yet. Crush some reps!
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {strengthSessions.map(ss => (
                <div key={ss.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className={cn("h-9 w-9 grid place-items-center rounded-lg shrink-0",
                      ss.bossSend ? "bg-boss/20 text-boss" : "bg-secondary text-foreground/70")}>
                      {ss.bossSend ? <Swords className="h-4 w-4" /> : <Dumbbell className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate capitalize flex items-center gap-2">
                        {ss.workout === "pullup" ? "Pull-up" : ss.workout === "pushup" ? "Push-up" : ss.workout === "handstand" ? "Handstand" : ss.workout === "squat" ? "Squat" : ss.workout === "plank" ? "Plank" : "Core"} · Level {ss.level}
                        {ss.bossSend && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-boss/20 text-boss border border-boss/40">Boss</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {(() => {
                          const isHandstand = ss.workout === "handstand";
                          const holds = ss.sets.filter(st => st.mode === "hold");
                          const reps = ss.sets.filter(st => st.mode !== "hold");
                          const parts: string[] = [];
                          if (holds.length) parts.push(`${holds.length} hold${holds.length === 1 ? "" : "s"}`);
                          if (reps.length) {
                            const repTotal = reps.reduce((a, b) => a + (b.reps || 0), 0);
                            parts.push(`${reps.length} set${reps.length === 1 ? "" : "s"} · ${repTotal} reps`);
                          }
                          const summary = parts.join(" · ") || `${ss.sets.length} set${ss.sets.length === 1 ? "" : "s"}`;
                          const detail = ss.sets.map(st => {
                            const lv = st.level ?? ss.level;
                            if (st.mode === "hold") return `L${lv} · ${st.reps}s`;
                            return `L${lv} · ${st.reps} reps`;
                          }).join(" / ");
                          return <>{new Date(ss.date).toLocaleDateString()} · {summary} · {detail}</>;
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {ss.chalkTotal ? (
                      <div className="text-sm font-bold tabular-nums gradient-chalk-text">+{ss.chalkTotal}</div>
                    ) : null}
                    <button
                      onClick={() => setDeleteStrengthId(ss.id)}
                      aria-label="Delete session"
                      className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GameCard>
      ) : tab === "board" ? (
        <GameCard className="p-0 overflow-hidden">
          {boardSessions.length === 0 ? (
            <div className="text-sm text-muted-foreground py-12 text-center">
              <Mountain className="h-8 w-8 mx-auto mb-2 opacity-60" />
              No board climbs yet. Send one on the MoonBoard or Kilter!
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {boardSessions.map(b => (
                <div key={b.id} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="h-9 w-9 grid place-items-center rounded-lg shrink-0 bg-secondary text-foreground/70">
                      <Mountain className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {boardLabel(b)}
                        {b.is_flash && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[hsl(var(--btn-orange))]/20 text-[hsl(var(--btn-orange))] border border-[hsl(var(--btn-orange))]/40">Flash</span>}
                        {b.is_benchmark && <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">Bench</span>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {new Date(b.logged_at).toLocaleDateString()} · {b.grade}
                        {b.problem_name ? ` · ${b.problem_name}` : ""}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {b.chalk_awarded ? (
                      <div className="text-sm font-bold tabular-nums gradient-chalk-text">+{b.chalk_awarded}</div>
                    ) : null}
                    <button
                      onClick={() => setDeleteBoardId(b.id)}
                      aria-label="Delete board climb"
                      className="h-8 w-8 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GameCard>
      ) : (
        <Hangboard />
      )}

    </div>
  );
}

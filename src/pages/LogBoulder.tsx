import { useEffect, useMemo, useState } from "react";
import { useGame, deleteLog, BoulderLog } from "@/game/store";
import { ACTIVITY_LABELS } from "@/game/data";
import { useGyms } from "@/game/gyms";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogModal } from "@/components/LogModal";
import { Plus, Swords, Sparkles, Filter, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type EntryFilter = "all" | "boulder" | "boss";

export default function BoulderLogs() {
  const s = useGame();
  const { gyms } = useGyms();
  const [open, setOpen] = useState(false);
  const [editLog, setEditLog] = useState<BoulderLog | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  useEffect(() => { setVisible(10); }, [entryFilter, grade, gymId, search]);
  const shown = filtered.slice(0, visible);

  return (
    <div className="space-y-5 animate-float-up">
      <LogModal
        open={open}
        onOpenChange={(v) => { setOpen(v); if (!v) setEditLog(null); }}
        editLog={editLog}
      />

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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Boulder Logs</h1>
          <p className="text-sm text-muted-foreground">Every problem and project you've logged.</p>
        </div>
        <GameButton variant="success" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Log Boulder
        </GameButton>
      </div>

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
                        className="h-9 w-9 rounded-lg shrink-0 border-2 border-border"
                        style={{ background: hold.hex }}
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
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold tabular-nums gradient-chalk-text">+{l.chalkTotal}</div>
                    {l.chalkBonus > 0 && <div className="text-[10px] text-muted-foreground">+{l.chalkBonus} bonus</div>}
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
    </div>
  );
}

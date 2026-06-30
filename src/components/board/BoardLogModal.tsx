import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GameButton } from "@/components/ui/game-button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Plus, X, Trophy } from "lucide-react";
import moonboardAsset from "@/assets/board-moonboard.png.asset.json";
import kilterAsset from "@/assets/board-kilter.png.asset.json";
import chalkBagImg from "@/assets/chalk-bag.png";
import { MOONBOARD_VARIANTS, type BoardType } from "@/game/board/types";
import { gradesForSystem, type BoardGradeSystem } from "@/game/board/grades";
import {
  loadBoardPrefs, saveBoardPrefs, useBoardSessions, logBoardSession, maxBoardRank, updateBoardSession,
} from "@/game/board/store";
import type { BoardSessionRow } from "@/game/board/types";

export function BoardLogModal({ onBack, onDone, editSession }: { onBack: () => void; onDone: () => void; editSession?: BoardSessionRow | null }) {
  const { user } = useAuth();
  const { sessions, refresh } = useBoardSessions();
  const prefs = loadBoardPrefs();
  const isEdit = !!editSession;

  const [boardType, setBoardType] = useState<BoardType>(editSession?.board_type ?? prefs.last_board_type);
  const [variant, setVariant] = useState<any>((editSession?.moonboard_variant as any) ?? prefs.last_moonboard_variant);
  const [angles, setAngles] = useState<number[]>(prefs.kilter_angles);
  const [angle, setAngle] = useState<number>(editSession?.kilter_angle ?? prefs.last_kilter_angle);
  const [editAngles, setEditAngles] = useState(false);
  const [newAngle, setNewAngle] = useState("");

  const [system, setSystem] = useState<BoardGradeSystem>(editSession?.grade_system ?? prefs.last_grade_system);
  const grades = useMemo(() => gradesForSystem(system), [system]);
  const [grade, setGrade] = useState(editSession?.grade ?? gradesForSystem(editSession?.grade_system ?? prefs.last_grade_system)[Math.min(5, gradesForSystem(editSession?.grade_system ?? prefs.last_grade_system).length - 1)]);
  useEffect(() => { if (!grades.includes(grade)) setGrade(grades[Math.min(5, grades.length - 1)]); }, [grades, grade]);

  const [date, setDate] = useState<string>(editSession?.logged_at ?? new Date().toISOString().slice(0, 10));
  const [problemName, setProblemName] = useState(editSession?.problem_name ?? "");
  const [isBenchmark, setIsBenchmark] = useState<boolean>(editSession?.is_benchmark ?? false);
  const [isFlash, setIsFlash] = useState<boolean>(editSession?.is_flash ?? false);
  const [notes, setNotes] = useState<string>(editSession?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [celebrate, setCelebrate] = useState<{ chalk: number; isPR: boolean; grade: string } | null>(null);

  function addAngle() {
    const v = Math.round(Number(newAngle));
    if (!isFinite(v) || v <= 0 || v > 90) { toast.error("Angle must be 1–90°"); return; }
    if (angles.includes(v)) { setNewAngle(""); return; }
    const next = [...angles, v].sort((a, b) => a - b);
    setAngles(next);
    saveBoardPrefs({ kilter_angles: next });
    setNewAngle("");
  }
  function removeAngle(v: number) {
    const next = angles.filter(a => a !== v);
    if (!next.length) return;
    setAngles(next);
    saveBoardPrefs({ kilter_angles: next });
    if (angle === v) setAngle(next[0]);
  }

  async function submit() {
    if (!user) { toast.error("Please sign in"); return; }
    setSubmitting(true);
    try {
      const payload = {
        board_type: boardType,
        moonboard_variant: boardType === "moonboard" ? variant : null,
        kilter_angle: boardType === "kilter" ? angle : null,
        problem_name: problemName.trim() || null,
        is_benchmark: isBenchmark,
        is_flash: isFlash,
        grade_system: system,
        grade,
        logged_at: date,
        notes: notes.trim() || null,
      };
      if (isEdit && editSession) {
        await updateBoardSession(editSession.id, payload);
        await refresh();
        toast.success("Board climb updated");
        onDone();
        return;
      }
      const prior = maxBoardRank(sessions);
      const { chalk, isPR } = await logBoardSession(user.id, payload, prior);
      saveBoardPrefs({
        last_board_type: boardType,
        last_moonboard_variant: variant,
        last_kilter_angle: angle,
        last_grade_system: system,
      });
      await refresh();
      setCelebrate({ chalk, isPR, grade });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not log board climb");
    } finally {
      setSubmitting(false);
    }
  }

  if (celebrate) {
    return (
      <BoardCelebrate
        chalk={celebrate.chalk}
        isPR={celebrate.isPR}
        grade={celebrate.grade}
        onDone={onDone}
      />
    );
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 rounded hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></button>
          <DialogTitle>{isEdit ? "Edit Board Climb" : "Log Board Climb"}</DialogTitle>
        </div>
      </DialogHeader>


      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1 pt-4">
        {/* Board picker */}
        <div className="grid grid-cols-2 gap-4 p-3">
          {([
            { type: "moonboard" as const, label: "MoonBoard", img: moonboardAsset.url, ring: "ring-[hsl(var(--epic))]" },
            { type: "kilter"    as const, label: "Kilter Board", img: kilterAsset.url, ring: "ring-[hsl(var(--rare))]" },
          ]).map(b => {
            const active = boardType === b.type;
            return (
              <button
                key={b.type}
                type="button"
                onClick={() => setBoardType(b.type)}
                className={cn(
                  "relative rounded-xl p-1 transition",
                  active ? `ring-4 ${b.ring}` : "opacity-70 hover:opacity-100",
                )}
              >
                <div className="relative overflow-hidden rounded-xl border-2 border-[hsl(var(--panel-frame))] bg-black/60">
                  <div className="aspect-square scale-[0.95]">
                    <img src={b.img} alt={b.label} className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 py-1.5 text-center text-sm font-bold">
                    {b.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Variant / angle */}
        {boardType === "moonboard" ? (
          <Field label="MoonBoard version">
            <Select value={variant} onValueChange={(v) => setVariant(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {MOONBOARD_VARIANTS.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        ) : (
          <Field label="Angle">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {angles.map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAngle(a)}
                    className={cn(
                      "px-3 py-1 rounded-md text-sm font-semibold border-2 border-[hsl(var(--panel-frame))] transition",
                      a === angle ? "bg-[hsl(var(--rare))]/30 ring-2 ring-[hsl(var(--rare))]" : "bg-secondary/40 hover:bg-secondary",
                    )}
                  >
                    {a}°
                    {editAngles && angles.length > 1 && (
                      <X
                        className="inline-block ml-1 h-3 w-3 opacity-70 hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); removeAngle(a); }}
                      />
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setEditAngles(v => !v)}
                  className="text-xs px-2 rounded-md border border-border bg-secondary/40 hover:bg-secondary"
                >
                  {editAngles ? "Done" : "Edit"}
                </button>
              </div>
              {editAngles && (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Add angle (e.g. 45)"
                    value={newAngle}
                    onChange={(e) => setNewAngle(e.target.value)}
                    className="max-w-40"
                  />
                  <button
                    type="button"
                    onClick={addAngle}
                    className="inline-flex items-center gap-1 px-3 rounded-md border-2 border-[hsl(var(--panel-frame))] bg-secondary text-sm font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              )}
            </div>
          </Field>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
          <Field label="Grading">
            <Select value={system} onValueChange={(v) => setSystem(v as BoardGradeSystem)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="v">V-scale (V0–V17)</SelectItem>
                <SelectItem value="french">French (4–9A)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Grade">
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{grades.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Problem name (optional)">
            <Input value={problemName} onChange={e => setProblemName(e.target.value)} placeholder="e.g. Tendon Crusher" />
          </Field>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isBenchmark} onCheckedChange={(v) => setIsBenchmark(!!v)} />
            <span className="text-sm font-semibold">Benchmark</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={isFlash} onCheckedChange={(v) => setIsFlash(!!v)} />
            <span className="text-sm font-semibold">Flashed</span>
          </label>
        </div>

        <Field label="Notes (optional)">
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
        </Field>

        <div className="flex justify-end pt-2">
          <GameButton variant="success" onClick={submit} disabled={submitting}>
            <Plus className="h-4 w-4" /> {submitting ? "Logging..." : "Log Send"}
          </GameButton>
        </div>
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function BoardCelebrate({ chalk, isPR, grade, onDone }: { chalk: number; isPR: boolean; grade: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, isPR ? 2600 : 1600);
    return () => clearTimeout(t);
  }, [onDone, isPR]);

  if (isPR) {
    return (
      <div className="relative py-10 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at center, hsl(var(--legendary) / 0.35), transparent 70%)" }} />
        <div className="relative">
          <Trophy className="mx-auto h-16 w-16 text-[hsl(var(--legendary))] drop-shadow-[0_0_24px_hsl(var(--legendary)/0.7)] animate-banner-pop" />
          <div className="mt-4 text-xs uppercase tracking-[0.3em] text-[hsl(var(--legendary))] font-bold">New Highest Grade</div>
          <div className="mt-2 text-5xl font-extrabold gradient-chalk-text tabular-nums animate-pop-in">{grade}</div>
          <div className="mt-1 text-sm text-muted-foreground italic">A new ceiling — the board respects you.</div>
          <div className="mt-5 flex items-center justify-center gap-3 animate-pop-in">
            <img src={chalkBagImg} alt="Chalk" className="h-12 w-12 object-contain drop-shadow-[0_4px_12px_hsl(var(--chalk-glow)/0.6)]" />
            <span className="text-4xl font-bold gradient-chalk-text tabular-nums">+{chalk}</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="py-10 text-center">
      <div className="menu-label">Board Sent · {grade}</div>
      <div className="mt-4 flex items-center justify-center gap-3 animate-pop-in">
        <img src={chalkBagImg} alt="Chalk" className="h-12 w-12 object-contain drop-shadow-[0_4px_12px_hsl(var(--chalk-glow)/0.6)]" />
        <span className="text-4xl font-bold gradient-chalk-text tabular-nums">+{chalk}</span>
      </div>
    </div>
  );
}

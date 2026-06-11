import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GameButton } from "@/components/ui/game-button";
import { GameCard } from "@/components/ui/game-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from "lucide-react";
import { HangboardOverlay } from "@/components/hangboard/HangboardOverlay";
import { useHoldLabel } from "@/game/hangboard/calibration";
import type { HangStep } from "@/game/hangboard/types";
import { fetchWorkout, saveWorkout } from "@/game/hangboard/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function HangboardBuilder() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const nav = useNavigate();
  const holdLabel = useHoldLabel();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [steps, setSteps] = useState<HangStep[]>([]);
  const [defaultHang, setDefaultHang] = useState(10);
  const [defaultRest, setDefaultRest] = useState(10);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (!id) return;
    fetchWorkout(id).then(w => {
      if (w) {
        setName(w.name);
        setDescription(w.description ?? "");
        setIsTemplate(w.isTemplate);
        setSteps(w.steps);
      }
      setLoading(false);
    });
  }, [id]);

  function addHang(holdId: string) {
    setSteps(prev => [...prev, { kind: "hang", holdId, seconds: defaultHang }]);
  }
  function addRest() {
    setSteps(prev => [...prev, { kind: "rest", seconds: defaultRest }]);
  }
  function updateStep(idx: number, patch: Partial<HangStep>) {
    setSteps(prev => prev.map((s, i) => i === idx ? ({ ...s, ...patch } as HangStep) : s));
  }
  function removeStep(idx: number) {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  }
  function move(idx: number, dir: -1 | 1) {
    setSteps(prev => {
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  async function onSave() {
    if (!user) return;
    if (!name.trim()) { toast.error("Give the workout a name"); return; }
    if (steps.length === 0) { toast.error("Add at least one step"); return; }
    const res = await saveWorkout({
      id,
      name,
      description: description.trim() || null,
      steps,
      isTemplate: isAdmin ? isTemplate : false,
      userId: user.id,
    });
    if ("error" in res) toast.error(res.error);
    else { toast.success("Saved"); nav("/hangboard"); }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{id ? "Edit workout" : "New hangboard workout"}</h1>
        <p className="text-sm text-muted-foreground">Tap a hold to add a hang step. Use the rest button between hangs.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <GameCard className="p-4 space-y-3">
            <div>
              <Label htmlFor="hb-name">Workout name</Label>
              <Input id="hb-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. 7/3 repeaters on 20mm" />
            </div>
            <div>
              <Label htmlFor="hb-desc">Description (optional)</Label>
              <Textarea id="hb-desc" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hang</Label>
                <Input type="number" min={1} max={120} value={defaultHang} onChange={e => setDefaultHang(Math.max(1, Number(e.target.value) || 0))} />
              </div>
              <div>
                <Label>Rest</Label>
                <Input type="number" min={1} max={600} value={defaultRest} onChange={e => setDefaultRest(Math.max(1, Number(e.target.value) || 0))} />
              </div>
            </div>
            {isAdmin && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isTemplate} onChange={e => setIsTemplate(e.target.checked)} />
                Save as template (visible to all users)
              </label>
            )}
          </GameCard>

          <GameCard className="p-3">
            <HangboardOverlay onSelect={h => addHang(h.id)} />
            <div className="flex items-center justify-between gap-2 mt-3 px-1">
              <p className="text-xs text-muted-foreground">Tap a hold to add a {defaultHang}s hang.</p>
              <GameButton variant="primary" size="md" onClick={addRest}>
                <Plus className="h-4 w-4" /> Add Rest ({defaultRest}s)
              </GameButton>
            </div>
          </GameCard>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold">Steps ({steps.length})</h2>
          {steps.length === 0 && (
            <p className="text-sm text-muted-foreground">No steps yet. Tap a hold on the board.</p>
          )}
          <ol className="space-y-2">
            {steps.map((s, idx) => (
              <li key={idx} className="flex items-center gap-2 bg-secondary/40 rounded-md border border-border p-2">
                <span className="w-6 text-xs text-muted-foreground tabular-nums">{idx + 1}.</span>
                <span className="flex-1 text-sm min-w-0 truncate">
                  {s.kind === "hang" ? (
                    <><b className="text-[hsl(var(--btn-orange))]">Hang</b> · {holdLabel(s.holdId)}</>
                  ) : (
                    <b className="text-[hsl(var(--sky))]">Rest</b>
                  )}
                </span>
                <label className={`flex items-center gap-1 text-xs ${s.kind === "hang" ? "text-[hsl(var(--btn-orange))]" : "text-[hsl(var(--sky))]"}`}>
                  <Input
                    type="number"
                    min={1}
                    max={600}
                    value={s.seconds}
                    onChange={e => updateStep(idx, { seconds: Math.max(1, Number(e.target.value) || 0) } as Partial<HangStep>)}
                    className="w-16 h-8"
                    aria-label={`${s.kind} seconds for step ${idx + 1}`}
                  />
                  <span>s</span>
                </label>
                <button onClick={() => move(idx, -1)} className="text-muted-foreground hover:text-foreground" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(idx, 1)} className="text-muted-foreground hover:text-foreground" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                <button onClick={() => removeStep(idx)} className="text-destructive hover:brightness-125" aria-label="Remove">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>

          <div className="flex gap-2 pt-2">
            <GameButton variant="primary" size="sm" onClick={onSave}>
              <Save className="h-4 w-4" /> Save
            </GameButton>
            <GameButton variant="ghost" size="sm" onClick={() => nav("/hangboard")}>Cancel</GameButton>
          </div>
        </div>
      </div>
    </div>
  );
}

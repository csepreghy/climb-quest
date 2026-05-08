import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GameButton } from "@/components/ui/game-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  type Gym, type GradingSystem, type GradingKind, type GradeEquivalent,
  gradeLabels, V_SCALE, FRENCH_SCALE,
} from "@/game/gyms";

type Source = "local" | "public";

interface Props {
  gym: Pick<Gym, "id" | "gradingSystemIds" | "gradingSystems">;
  source: Source;
  onSelectSystem: (gsId: string) => void;
  onAddCustom: (g: Omit<GradingSystem, "id">) => void;
  onUpdateCustom: (gsId: string, patch: Partial<GradingSystem>) => void;
  onDeleteCustom: (gsId: string) => void;
}

export function GymGradingEditor(p: Props) {
  const { gym } = p;
  const selectedId = gym.gradingSystemIds[0];
  const customs = gym.gradingSystems ?? [];

  return (
    <section className="space-y-3">
      <div className="menu-label">Grading system</div>
      <p className="text-[11px] text-muted-foreground -mt-1">Pick one. Custom systems can optionally map to V or French equivalents.</p>

      <div className="flex flex-wrap gap-2">
        <ToggleChip on={selectedId === "v_grades"} label="V Scale" sub="v" onClick={() => p.onSelectSystem("v_grades")} />
        <ToggleChip on={selectedId === "french_grades"} label="French (Font)" sub="french" onClick={() => p.onSelectSystem("french_grades")} />
      </div>

      {customs.length > 0 && (
        <div className="space-y-2">
          {customs.map(gs => (
            <CustomGradingCard key={gs.id} gs={gs}
              selected={selectedId === gs.id}
              onSelect={() => p.onSelectSystem(gs.id)}
              onUpdate={(patch) => p.onUpdateCustom(gs.id, patch)}
              onDelete={() => p.onDeleteCustom(gs.id)} />
          ))}
        </div>
      )}

      <AddCustomGrading onAdd={p.onAddCustom} />
    </section>
  );
}

function ToggleChip({ on, label, sub, onClick }: { on: boolean; label: string; sub: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn("text-xs px-3 py-1.5 rounded-md border-2 transition",
        on
          ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15 text-foreground"
          : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground")}>
      {label} <span className="text-[10px] opacity-70">({sub})</span>
    </button>
  );
}

function AddCustomGrading({ onAdd }: { onAdd: (g: Omit<GradingSystem, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GradingKind>("number");
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(5);
  const [openEnded, setOpenEnded] = useState(true);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="text-xs px-3 py-1.5 rounded-md border border-dashed border-border bg-secondary/30 hover:border-[hsl(var(--btn-orange))] inline-flex items-center gap-1.5">
        <Plus className="h-3 w-3" /> Add custom grading
      </button>
    );
  }

  return (
    <div className="rounded-md border border-border bg-secondary/30 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold">New custom grading</div>
        <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid sm:grid-cols-[1fr,140px,auto] gap-2">
        <Input placeholder="Name (e.g. 'House numbers')" value={name} onChange={e => setName(e.target.value)} />
        <Select value={kind} onValueChange={v => setKind(v as GradingKind)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="number">Number range</SelectItem>
            <SelectItem value="color">Colors</SelectItem>
          </SelectContent>
        </Select>
        <GameButton variant="primary" size="sm" onClick={() => {
          if (!name.trim()) { toast.error("Name required"); return; }
          if (kind === "number") onAdd({ name: name.trim(), kind, numberMin: min, numberMax: max, lastOpenEnded: openEnded });
          else onAdd({ name: name.trim(), kind, colors: [], lastOpenEnded: openEnded });
          setName(""); setOpen(false);
          toast.success("Custom grading added");
        }}><Plus className="h-3.5 w-3.5" /> Add</GameButton>
      </div>
      {kind === "number" && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Label>Min</Label>
          <Input type="number" value={min} onChange={e => setMin(parseInt(e.target.value) || 0)} className="h-8 w-20" />
          <Label>Max</Label>
          <Input type="number" value={max} onChange={e => setMax(parseInt(e.target.value) || 0)} className="h-8 w-20" />
          <label className="flex items-center gap-1.5 ml-2 text-muted-foreground">
            <input type="checkbox" checked={openEnded} onChange={e => setOpenEnded(e.target.checked)} />
            Last grade open-ended (e.g. {max}+)
          </label>
        </div>
      )}
    </div>
  );
}

function CustomGradingCard({ gs, selected, onSelect, onUpdate, onDelete }: {
  gs: GradingSystem;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<GradingSystem>) => void;
  onDelete: () => void;
}) {
  const labels = gradeLabels(gs);
  const [showEq, setShowEq] = useState(false);
  const initialScale: "v" | "french" = (() => {
    const eqs = Object.values(gs.equivalents ?? {});
    const hasFrench = eqs.some(e => e.frenchStart || e.frenchEnd);
    const hasV = eqs.some(e => e.vStart || e.vEnd);
    return !hasV && hasFrench ? "french" : "v";
  })();
  const [scale, setScale] = useState<"v" | "french">(initialScale);
  useEffect(() => { setScale(initialScale); }, [gs.id]);
  const options = (scale === "v" ? V_SCALE : FRENCH_SCALE) as readonly string[];

  const [draft, setDraft] = useState<Record<string, GradeEquivalent>>(gs.equivalents ?? {});
  useEffect(() => { setDraft(gs.equivalents ?? {}); }, [gs.id, gs.equivalents, gs.numberMin, gs.numberMax, gs.lastOpenEnded]);
  const dirty = JSON.stringify(draft) !== JSON.stringify(gs.equivalents ?? {});

  return (
    <div className={cn("rounded-md border-2 p-3 space-y-3",
      selected ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/10" : "border-border bg-secondary/30")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="radio"
            checked={selected}
            onChange={onSelect}
            className="h-4 w-4 accent-[hsl(var(--btn-orange))] cursor-pointer"
            aria-label={`Use ${gs.name}`}
          />
          <Input value={gs.name} onChange={e => onUpdate({ name: e.target.value })} className="h-8 flex-1 max-w-xs" />
          <span className="text-[10px] uppercase text-muted-foreground">{gs.kind}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowEq(v => !v)} className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5">
            {showEq ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Equivalents <span className="opacity-70">(optional)</span>
          </button>
          <button className="text-destructive p-1" onClick={() => { if (confirm(`Delete ${gs.name}?`)) onDelete(); }}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {gs.kind === "number" && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Label>Min</Label>
          <Input type="number" value={gs.numberMin ?? 1} onChange={e => onUpdate({ numberMin: parseInt(e.target.value) || 0 })} className="h-8 w-20" />
          <Label>Max</Label>
          <Input type="number" value={gs.numberMax ?? 5} onChange={e => onUpdate({ numberMax: parseInt(e.target.value) || 0 })} className="h-8 w-20" />
          <label className="flex items-center gap-1.5 ml-2 text-muted-foreground">
            <input type="checkbox" checked={!!gs.lastOpenEnded} onChange={e => onUpdate({ lastOpenEnded: e.target.checked })} />
            Last grade open-ended
          </label>
        </div>
      )}

      {gs.kind === "color" && <ColorEditor gs={gs} onUpdate={onUpdate} />}

      {showEq && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase text-muted-foreground">
              Optional: map each grade to a {scale === "v" ? "V" : "French"} range.
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button onClick={() => setScale("v")}
                className={cn("px-2 py-1 rounded-md border-2", scale === "v" ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15" : "border-border bg-secondary/40 text-muted-foreground")}>V</button>
              <button onClick={() => setScale("french")}
                className={cn("px-2 py-1 rounded-md border-2", scale === "french" ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15" : "border-border bg-secondary/40 text-muted-foreground")}>French</button>
            </div>
          </div>
          {labels.map((lab, i) => {
            const isLast = i === labels.length - 1;
            const eq = draft[lab] ?? {};
            const start = scale === "v" ? eq.vStart : eq.frenchStart;
            const end = scale === "v" ? eq.vEnd : eq.frenchEnd;
            return (
              <div key={lab} className="grid grid-cols-[80px,1fr] gap-2 items-center">
                <span className="text-xs font-semibold">{lab}</span>
                <RangePicker
                  options={options}
                  start={start} end={end}
                  allowOpenEnd={isLast}
                  onChange={(s, e) => setDraft(d => ({
                    ...d,
                    [lab]: scale === "v"
                      ? { ...(d[lab] ?? {}), vStart: s, vEnd: e }
                      : { ...(d[lab] ?? {}), frenchStart: s, frenchEnd: e },
                  }))}
                />
              </div>
            );
          })}
          <div className="flex items-center justify-end gap-2 pt-2">
            {dirty && <span className="text-[10px] uppercase text-muted-foreground">Unsaved changes</span>}
            <GameButton size="sm" variant="primary" disabled={!dirty} onClick={() => {
              onUpdate({ equivalents: draft });
              toast.success("Equivalents saved");
            }}>Save</GameButton>
          </div>
        </div>
      )}
    </div>
  );
}

function RangePicker({
  options, start, end, allowOpenEnd, onChange,
}: {
  options: readonly string[];
  start?: string; end?: string;
  allowOpenEnd: boolean;
  onChange: (start?: string, end?: string) => void;
}) {
  const NONE = "__none__";
  return (
    <div className="flex items-center gap-1">
      <Select value={start ?? NONE} onValueChange={v => onChange(v === NONE ? undefined : v, end)}>
        <SelectTrigger className="h-8 text-xs flex-1 min-w-0"><SelectValue placeholder="—" /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground text-xs">→</span>
      <Select value={end ?? NONE} onValueChange={v => onChange(start, v === NONE ? undefined : v)} disabled={!start}>
        <SelectTrigger className="h-8 text-xs flex-1 min-w-0"><SelectValue placeholder={allowOpenEnd ? "open" : "—"} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{allowOpenEnd ? "open" : "—"}</SelectItem>
          {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function ColorEditor({ gs, onUpdate }: { gs: GradingSystem; onUpdate: (patch: Partial<GradingSystem>) => void }) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#3b82f6");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(gs.colors ?? []).map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-background/50 text-xs">
            <span className="h-4 w-4 rounded border border-[hsl(var(--panel-frame))]" style={{ background: c.hex }} />
            {c.name}
            <button onClick={() => onUpdate({ colors: (gs.colors ?? []).filter((_, j) => j !== i) })}>
              <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="h-8 w-8 rounded cursor-pointer" />
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Color name" className="h-8 w-32" />
        <GameButton size="sm" variant="primary" onClick={() => {
          if (!name.trim()) return;
          onUpdate({ colors: [...(gs.colors ?? []), { name: name.trim(), hex }] });
          setName("");
        }}>Add</GameButton>
      </div>
    </div>
  );
}

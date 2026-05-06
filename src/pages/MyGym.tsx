import { useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGyms, addGym, updateGym, deleteGym, setPrimaryGym,
  addHoldColor, removeHoldColor,
  addGradingSystem, updateGradingSystem, deleteGradingSystem, toggleGymGradingSystem,
  setEquivalent, gradeLabels,
  V_SCALE, FRENCH_SCALE,
  GradingSystem, GradingKind, GradeEquivalent,
} from "@/game/gyms";
import { Plus, X, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function MyGym() {
  const s = useGyms();
  const [newName, setNewName] = useState("");
  const [newLoc, setNewLoc] = useState("");

  return (
    <div className="space-y-6 animate-float-up max-w-4xl">
      <GameCard tone="accent" className="p-5">
        <div className="menu-label mb-3">Add a gym</div>
        <div className="grid sm:grid-cols-[1fr,1fr,auto] gap-2">
          <Input placeholder="Gym name" value={newName} onChange={e => setNewName(e.target.value)} />
          <Input placeholder="Location (city)" value={newLoc} onChange={e => setNewLoc(e.target.value)} />
          <GameButton variant="primary" onClick={() => {
            if (!newName.trim()) { toast.error("Name required"); return; }
            addGym(newName.trim(), newLoc.trim()); setNewName(""); setNewLoc("");
          }}><Plus className="h-4 w-4" /> Add</GameButton>
        </div>
      </GameCard>

      {s.gyms.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No gyms yet. Add your home crag above.</p>
      )}

      {s.gyms.map(g => (
        <GameCard key={g.id} className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 grid sm:grid-cols-2 gap-2">
              <Input value={g.name} onChange={e => updateGym(g.id, { name: e.target.value })} />
              <Input value={g.location} onChange={e => updateGym(g.id, { location: e.target.value })} placeholder="Location" />
            </div>
            <div className="flex items-center gap-1">
              <GameButton size="sm" variant={g.primary ? "legendary" : "ghost"} onClick={() => setPrimaryGym(g.id)} title="Make primary">
                <Star className="h-4 w-4" /> {g.primary ? "Primary" : "Set primary"}
              </GameButton>
              <GameButton size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${g.name}?`)) deleteGym(g.id); }}>
                <Trash2 className="h-4 w-4" />
              </GameButton>
            </div>
          </div>

          <section>
            <div className="menu-label mb-2">Hold colors</div>
            <div className="flex flex-wrap gap-2">
              {g.holdColors.map(c => (
                <div key={c.id} className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-secondary/40">
                  <span className="h-5 w-5 rounded border border-[hsl(var(--panel-frame))]" style={{ background: c.hex }} />
                  <span className="text-xs">{c.name}</span>
                  <button onClick={() => removeHoldColor(g.id, c.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <AddHoldColor onAdd={(name, hex) => addHoldColor(g.id, { name, hex })} />
            </div>
          </section>

          <section>
            <div className="menu-label mb-2">Grading systems used</div>
            <div className="flex flex-wrap gap-2">
              {s.gradingSystems.map(gs => {
                const on = g.gradingSystemIds.includes(gs.id);
                return (
                  <button key={gs.id} onClick={() => toggleGymGradingSystem(g.id, gs.id)}
                    className={cn("text-xs px-3 py-1.5 rounded-md border-2 transition",
                      on
                        ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15 text-foreground"
                        : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground")}>
                    {gs.name} <span className="text-[10px] opacity-70">({gs.kind})</span>
                  </button>
                );
              })}
            </div>
          </section>
        </GameCard>
      ))}

      <CreateCustomGradingSystem />

      {/* Custom systems list (built-ins hidden) */}
      <div className="space-y-3">
        {s.gradingSystems.filter(gs => gs.id !== "v_grades" && gs.id !== "french_grades").map(gs => (
          <GradingSystemCard key={gs.id} gs={gs} />
        ))}
      </div>
    </div>
  );
}

function AddHoldColor({ onAdd }: { onAdd: (name: string, hex: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#22c55e");
  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs px-3 py-1 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-[hsl(var(--btn-orange))]">
      <Plus className="h-3 w-3 inline" /> Add color
    </button>
  );
  return (
    <div className="flex items-center gap-2 p-2 rounded-md border border-border bg-secondary/40">
      <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="h-8 w-8 cursor-pointer rounded" />
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="h-8 w-28" />
      <GameButton size="sm" variant="primary" onClick={() => { if (!name.trim()) return; onAdd(name.trim(), hex); setName(""); setOpen(false); }}>Add</GameButton>
      <button onClick={() => setOpen(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
    </div>
  );
}

function CreateCustomGradingSystem() {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GradingKind>("number");
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(5);
  const [openEnded, setOpenEnded] = useState(true);

  return (
    <GameCard tone="legendary" className="p-5 space-y-4">
      <div>
        <div className="menu-label">Create custom grading system</div>
        <p className="text-xs text-muted-foreground mt-1">Define your gym's own number or color grades. Map each one to a V or French range.</p>
      </div>

      <div className="grid sm:grid-cols-[1fr,140px,auto] gap-2">
        <Input placeholder="System name (e.g. 'House numbers')" value={name} onChange={e => setName(e.target.value)} />
        <select value={kind} onChange={e => setKind(e.target.value as GradingKind)} className={cn(SELECT_CLS, "h-10 text-sm")}>
          <option value="number">Number range</option>
          <option value="color">Colors</option>
        </select>
        <GameButton variant="primary" onClick={() => {
          if (!name.trim()) { toast.error("Name required"); return; }
          if (kind === "number") {
            addGradingSystem({ name: name.trim(), kind, numberMin: min, numberMax: max, lastOpenEnded: openEnded });
          } else {
            addGradingSystem({ name: name.trim(), kind, colors: [], lastOpenEnded: openEnded });
          }
          setName("");
          toast.success("Created — now assign to a gym above");
        }}><Plus className="h-4 w-4" /> Create</GameButton>
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
    </GameCard>
  );
}

function GradingSystemCard({ gs }: { gs: GradingSystem }) {
  const labels = gradeLabels(gs);
  const [showEq, setShowEq] = useState(true);
  const [scale, setScale] = useState<"v" | "french">("v");
  const options = (scale === "v" ? V_SCALE : FRENCH_SCALE) as readonly string[];
  return (
    <GameCard className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{gs.name} <span className="text-[10px] uppercase text-muted-foreground">{gs.kind}</span></div>
          {gs.kind === "number" && <div className="text-xs text-muted-foreground">Range {gs.numberMin}–{gs.numberMax}{gs.lastOpenEnded ? ` (+${gs.numberMax}+)` : ""}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowEq(v => !v)}>
            {showEq ? "Hide" : "Show"} equivalents
          </button>
          <button className="text-destructive" onClick={() => { if (confirm(`Delete ${gs.name}?`)) deleteGradingSystem(gs.id); }}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {gs.kind === "number" && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Label>Min</Label>
          <Input type="number" value={gs.numberMin} onChange={e => updateGradingSystem(gs.id, { numberMin: parseInt(e.target.value) || 0 })} className="h-8 w-20" />
          <Label>Max</Label>
          <Input type="number" value={gs.numberMax} onChange={e => updateGradingSystem(gs.id, { numberMax: parseInt(e.target.value) || 0 })} className="h-8 w-20" />
          <label className="flex items-center gap-1.5 ml-2 text-muted-foreground">
            <input type="checkbox" checked={!!gs.lastOpenEnded} onChange={e => updateGradingSystem(gs.id, { lastOpenEnded: e.target.checked })} />
            Last grade open-ended
          </label>
        </div>
      )}

      {gs.kind === "color" && <ColorEditor gs={gs} />}

      {showEq && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] uppercase text-muted-foreground">
              Map each grade to a {scale === "v" ? "V" : "French"} range. Last entry can be open.
            </div>
            <div className="flex items-center gap-1 text-xs">
              <button onClick={() => setScale("v")}
                className={cn("px-2 py-1 rounded-md border-2", scale === "v" ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15" : "border-border bg-secondary/40 text-muted-foreground")}>V</button>
              <button onClick={() => setScale("french")}
                className={cn("px-2 py-1 rounded-md border-2", scale === "french" ? "border-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/15" : "border-border bg-secondary/40 text-muted-foreground")}>French</button>
            </div>
          </div>
          <div className="grid grid-cols-[80px,1fr] gap-2 items-center text-[10px] uppercase text-muted-foreground px-1">
            <span>Grade</span><span>{scale === "v" ? "V scale" : "French"} (start → end)</span>
          </div>
          {labels.map((lab, i) => {
            const isLast = i === labels.length - 1;
            const eq = gs.equivalents?.[lab] ?? {};
            const start = scale === "v" ? eq.vStart : eq.frenchStart;
            const end = scale === "v" ? eq.vEnd : eq.frenchEnd;
            return (
              <div key={lab} className="grid grid-cols-[80px,1fr] gap-2 items-center">
                <span className="text-xs font-semibold">{lab}</span>
                <RangePicker
                  options={options}
                  start={start} end={end}
                  allowOpenEnd={isLast}
                  onChange={(s, e) => setEquivalent(gs.id, lab, scale === "v" ? { ...eq, vStart: s, vEnd: e } : { ...eq, frenchStart: s, frenchEnd: e })}
                />
              </div>
            );
          })}
        </div>
      )}
    </GameCard>
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
  return (
    <div className="flex items-center gap-1">
      <select value={start ?? ""} onChange={e => onChange(e.target.value || undefined, end)} className={cn(SELECT_CLS, "flex-1 min-w-0")}>
        <option value="">—</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="text-muted-foreground text-xs">→</span>
      <select value={end ?? ""} onChange={e => onChange(start, e.target.value || undefined)} className={cn(SELECT_CLS, "flex-1 min-w-0")} disabled={!start}>
        <option value="">{allowOpenEnd ? "open" : "—"}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function ColorEditor({ gs }: { gs: GradingSystem }) {
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#3b82f6");
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(gs.colors ?? []).map((c, i) => (
          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-secondary/40 text-xs">
            <span className="h-4 w-4 rounded border border-[hsl(var(--panel-frame))]" style={{ background: c.hex }} />
            {c.name}
            <button onClick={() => updateGradingSystem(gs.id, { colors: (gs.colors ?? []).filter((_, j) => j !== i) })}>
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
          updateGradingSystem(gs.id, { colors: [...(gs.colors ?? []), { name: name.trim(), hex }] });
          setName("");
        }}>Add</GameButton>
      </div>
    </div>
  );
}

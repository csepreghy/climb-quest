import { useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useGyms, addGym, updateGym, deleteGym, setPrimaryGym,
  addHoldColor, removeHoldColor,
  addGradingSystem, updateGradingSystem, deleteGradingSystem, toggleGymGradingSystem,
  setEquivalent, gradeLabels, GradingSystem, GradingKind,
} from "@/game/gyms";
import { Plus, X, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

          {/* Hold colors */}
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

          {/* Grading systems for this gym */}
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

      <GradingSystemsSection />
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

function GradingSystemsSection() {
  const s = useGyms();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<GradingKind>("number");
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(10);

  return (
    <GameCard tone="legendary" className="p-5 space-y-4">
      <div>
        <div className="menu-label">Grading systems</div>
        <p className="text-xs text-muted-foreground mt-1">V scale and French are built-in. Add your own number or color systems.</p>
      </div>

      <div className="grid sm:grid-cols-[1fr,140px,auto] gap-2">
        <Input placeholder="System name (e.g. 'House numbers')" value={name} onChange={e => setName(e.target.value)} />
        <select value={kind} onChange={e => setKind(e.target.value as GradingKind)}
          className="h-10 rounded-md border-2 border-[hsl(var(--panel-frame))] bg-background/80 px-2 text-sm shadow-[inset_0_2px_0_hsl(0_0%_0%/0.45)]">
          <option value="number">Number range</option>
          <option value="color">Colors</option>
        </select>
        <GameButton variant="primary" onClick={() => {
          if (!name.trim()) { toast.error("Name required"); return; }
          if (kind === "number") {
            addGradingSystem({ name: name.trim(), kind, numberMin: min, numberMax: max });
          } else {
            addGradingSystem({ name: name.trim(), kind, colors: [] });
          }
          setName("");
        }}><Plus className="h-4 w-4" /> Add</GameButton>
      </div>

      {kind === "number" && (
        <div className="flex items-center gap-2 text-xs">
          <Label>Min</Label>
          <Input type="number" value={min} onChange={e => setMin(parseInt(e.target.value) || 0)} className="h-8 w-20" />
          <Label>Max</Label>
          <Input type="number" value={max} onChange={e => setMax(parseInt(e.target.value) || 0)} className="h-8 w-20" />
          <span className="text-muted-foreground">(highest gets a "+" appended)</span>
        </div>
      )}

      <div className="space-y-3">
        {s.gradingSystems.map(gs => <GradingSystemCard key={gs.id} gs={gs} />)}
      </div>
    </GameCard>
  );
}

function GradingSystemCard({ gs }: { gs: GradingSystem }) {
  const builtIn = gs.id === "v_grades" || gs.id === "french_grades";
  const labels = gradeLabels(gs);
  const [showEq, setShowEq] = useState(false);
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">{gs.name} <span className="text-[10px] uppercase text-muted-foreground">{gs.kind}</span></div>
          {gs.kind === "number" && <div className="text-xs text-muted-foreground">Range {gs.numberMin}–{gs.numberMax}</div>}
        </div>
        <div className="flex items-center gap-1">
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowEq(v => !v)}>
            {showEq ? "Hide" : "Equivalents"}
          </button>
          {!builtIn && (
            <button className="text-destructive" onClick={() => { if (confirm(`Delete ${gs.name}?`)) deleteGradingSystem(gs.id); }}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {gs.kind === "color" && !builtIn && (
        <ColorEditor gs={gs} />
      )}

      {gs.kind === "number" && !builtIn && (
        <div className="flex gap-2 text-xs">
          <Label>Min</Label>
          <Input type="number" value={gs.numberMin} onChange={e => updateGradingSystem(gs.id, { numberMin: parseInt(e.target.value) || 0 })} className="h-8 w-20" />
          <Label>Max</Label>
          <Input type="number" value={gs.numberMax} onChange={e => updateGradingSystem(gs.id, { numberMax: parseInt(e.target.value) || 0 })} className="h-8 w-20" />
        </div>
      )}

      {/* Equivalents — only for non-V/non-French */}
      {showEq && !builtIn && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase text-muted-foreground">Equivalent grades (V / French range)</div>
          {labels.map(lab => {
            const eq = gs.equivalents?.[lab] ?? {};
            return (
              <div key={lab} className="grid grid-cols-[60px,1fr,1fr] gap-2 items-center">
                <span className="text-xs">{lab}</span>
                <Input value={eq.v ?? ""} onChange={e => setEquivalent(gs.id, lab, { ...eq, v: e.target.value })} placeholder="V4 or V3-V5" className="h-8" />
                <Input value={eq.french ?? ""} onChange={e => setEquivalent(gs.id, lab, { ...eq, french: e.target.value })} placeholder="6B+ or 6A-6B+" className="h-8" />
              </div>
            );
          })}
        </div>
      )}
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

import { useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Input } from "@/components/ui/input";
import {
  useGyms, addGym, updateGym, deleteGym, setPrimaryGym,
  addHoldColor, removeHoldColor,
  toggleGymGradingSystem,
  addGymCustomGrading, updateGymCustomGrading, deleteGymCustomGrading,
  addPublicGymToMine, removePublicGymFromMine,
} from "@/game/gyms";
import { usePublicGyms } from "@/game/publicGyms";
import { COUNTRIES } from "@/game/countries";
import { Plus, X, Star, Trash2, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { HoldSwatch } from "@/components/HoldSwatch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AddHoldColor } from "@/components/AddHoldColor";
import { GymGradingEditor } from "@/components/GymGradingEditor";

export default function MyGym() {
  const s = useGyms();
  const pub = usePublicGyms();
  const [newName, setNewName] = useState("");
  const [newLoc, setNewLoc] = useState("");
  const [newCountry, setNewCountry] = useState<string>("");

  const addedPublic = pub.gyms.filter(g => s.addedPublicGymIds.includes(g.id));
  const availablePublic = pub.gyms.filter(g => !s.addedPublicGymIds.includes(g.id));

  return (
    <div className="space-y-6 animate-float-up max-w-4xl">
      <GameCard tone="accent" className="p-5">
        <div className="menu-label mb-3">Add a gym</div>
        <div className="grid sm:grid-cols-[1fr,1fr,1fr,auto] gap-2">
          <Input placeholder="Gym name" value={newName} onChange={e => setNewName(e.target.value)} />
          <Input placeholder="Location (city)" value={newLoc} onChange={e => setNewLoc(e.target.value)} />
          <Select value={newCountry || undefined} onValueChange={setNewCountry}>
            <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <GameButton variant="primary" onClick={() => {
            if (!newName.trim()) { toast.error("Name required"); return; }
            addGym(newName.trim(), newLoc.trim(), newCountry || undefined);
            setNewName(""); setNewLoc(""); setNewCountry("");
          }}><Plus className="h-4 w-4" /> Add</GameButton>
        </div>
      </GameCard>

      {availablePublic.length > 0 && (
        <GameCard className="p-5 space-y-3">
          <div className="menu-label flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Add a public gym</div>
          <p className="text-xs text-muted-foreground">Gyms curated by admins. Add to your list to log climbs there.</p>
          <div className="flex flex-wrap gap-2">
            {availablePublic.map(g => (
              <button
                key={g.id}
                onClick={() => { addPublicGymToMine(g.id); toast.success(`${g.name} added to your gyms`); }}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-secondary/40 hover:border-[hsl(var(--btn-orange))] text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="font-semibold">{g.name}</span>
                {(g.location || g.country) && <span className="text-muted-foreground">· {[g.location, g.country].filter(Boolean).join(", ")}</span>}
              </button>
            ))}
          </div>
        </GameCard>
      )}

      {s.gyms.length === 0 && addedPublic.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No gyms yet. Add your home crag above.</p>
      )}

      {s.gyms.map(g => (
        <GameCard key={g.id} className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 grid sm:grid-cols-3 gap-2">
              <Input value={g.name} onChange={e => updateGym(g.id, { name: e.target.value })} />
              <Input value={g.location} onChange={e => updateGym(g.id, { location: e.target.value })} placeholder="Location" />
              <Select value={g.country ?? undefined} onValueChange={v => updateGym(g.id, { country: v })}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
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
                  <HoldSwatch hex={c.hex} hex2={c.hex2} className="h-5 w-5" />
                  <span className="text-xs">{c.name}</span>
                  <button onClick={() => removeHoldColor(g.id, c.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <AddHoldColor onAdd={(c) => addHoldColor(g.id, c)} />
            </div>
          </section>

          <GymGradingEditor
            gym={g}
            source="local"
            onSelectSystem={(gsId) => updateGym(g.id, { gradingSystemIds: [gsId] })}
            onAddCustom={(gs) => {
              const id = addGymCustomGrading(g.id, gs);
              updateGym(g.id, { gradingSystemIds: [id] });
            }}
            onUpdateCustom={(gsId, patch) => updateGymCustomGrading(g.id, gsId, patch)}
            onDeleteCustom={(gsId) => deleteGymCustomGrading(g.id, gsId)}
          />
        </GameCard>
      ))}

      {addedPublic.map(g => (
        <GameCard key={g.id} className="p-5 space-y-4 opacity-95">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="font-semibold">{g.name}</h3>
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">Public</span>
              </div>
              {(g.location || g.country) && <div className="text-xs text-muted-foreground mt-0.5">{[g.location, g.country].filter(Boolean).join(" · ")}</div>}
              <div className="text-[11px] text-muted-foreground mt-1 italic">Admin-managed — read only.</div>
            </div>
            <GameButton size="sm" variant="ghost" onClick={() => { if (confirm(`Remove ${g.name} from your gyms?`)) removePublicGymFromMine(g.id); }}>
              <Trash2 className="h-4 w-4" /> Remove
            </GameButton>
          </div>
          <section>
            <div className="menu-label mb-2">Hold colors</div>
            <div className="flex flex-wrap gap-2">
              {g.holdColors.map(c => (
                <div key={c.id} className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-secondary/40">
                  <HoldSwatch hex={c.hex} hex2={c.hex2} className="h-5 w-5" />
                  <span className="text-xs">{c.name}</span>
                </div>
              ))}
            </div>
          </section>
        </GameCard>
      ))}
    </div>
  );
}

// AddHoldColor moved to src/components/AddHoldColor.tsx
// GymGradingEditor moved to src/components/GymGradingEditor.tsx

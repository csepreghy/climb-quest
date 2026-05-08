import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GameButton } from "@/components/ui/game-button";
import { cn } from "@/lib/utils";
import type { HoldColor } from "@/game/gyms";

export const HOLD_COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Green", hex: "#22c55e" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Purple", hex: "#a855f7" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Black", hex: "#0a0a0a" },
  { name: "White", hex: "#f5f5f5" },
  { name: "Grey", hex: "#737373" },
  { name: "Brown", hex: "#92400e" },
  { name: "Tan", hex: "#d4a373" },
];

export type AddHoldColorPayload = Omit<HoldColor, "id">;

export function AddHoldColor({ onAdd }: { onAdd: (c: AddHoldColorPayload) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"presets" | "custom" | "multi">("presets");
  const [name, setName] = useState("");
  const [hex, setHex] = useState("#22c55e");
  const [hex2, setHex2] = useState("#ef4444");
  const [pick1, setPick1] = useState<{ name: string; hex: string } | null>(null);

  if (!open) return (
    <button onClick={() => setOpen(true)} className="text-xs px-3 py-1 rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-[hsl(var(--btn-orange))]">
      <Plus className="h-3 w-3 inline" /> Add color
    </button>
  );

  const close = () => {
    setOpen(false); setMode("presets"); setName("");
    setHex("#22c55e"); setHex2("#ef4444"); setPick1(null);
  };

  return (
    <div className="w-full p-3 rounded-md border border-border bg-secondary/40 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold">
          {mode === "multi"
            ? (pick1 ? `Pick second color (paired with ${pick1.name})` : "Pick first color")
            : "Pick a hold color"}
        </div>
        <button onClick={close} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>

      {mode === "presets" && (
        <div className="flex flex-wrap gap-2">
          {HOLD_COLOR_PRESETS.map(p => (
            <button
              key={p.hex}
              onClick={() => { onAdd({ name: p.name, hex: p.hex }); close(); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-background/50 hover:border-[hsl(var(--btn-orange))] text-xs"
            >
              <span className="h-4 w-4 rounded-full border border-[hsl(var(--panel-frame))]" style={{ background: p.hex }} />
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setMode("multi")}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-border bg-background/50 hover:border-[hsl(var(--btn-orange))] text-xs"
          >
            <span className="h-4 w-4 rounded-full border border-[hsl(var(--panel-frame))]"
              style={{ background: "linear-gradient(90deg, #ef4444 0 50%, #3b82f6 50% 100%)" }} />
            Multicolor (2)
          </button>
          <button
            onClick={() => setMode("custom")}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-border bg-background/50 hover:border-[hsl(var(--btn-orange))] text-xs"
          >
            <span className="h-4 w-4 rounded-full border border-[hsl(var(--panel-frame))]"
              style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} />
            Custom
          </button>
        </div>
      )}

      {mode === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="h-8 w-8 cursor-pointer rounded" />
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name" className="h-8 w-32" />
          <GameButton size="sm" variant="primary" onClick={() => { if (!name.trim()) return; onAdd({ name: name.trim(), hex }); close(); }}>Add</GameButton>
          <button onClick={() => setMode("presets")} className="text-xs text-muted-foreground hover:text-foreground">Back</button>
        </div>
      )}

      {mode === "multi" && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {HOLD_COLOR_PRESETS.map(p => {
              const isFirst = pick1?.hex === p.hex;
              return (
                <button
                  key={p.hex}
                  onClick={() => {
                    if (!pick1) { setPick1(p); return; }
                    if (p.hex === pick1.hex) { setPick1(null); return; }
                    onAdd({ name: `${pick1.name}/${p.name}`, hex: pick1.hex, hex2: p.hex });
                    close();
                  }}
                  className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md border bg-background/50 hover:border-[hsl(var(--btn-orange))] text-xs",
                    isFirst ? "border-[hsl(var(--btn-orange))] ring-2 ring-[hsl(var(--btn-orange))]/30" : "border-border")}
                >
                  <span className="h-4 w-4 rounded-full border border-[hsl(var(--panel-frame))]" style={{ background: p.hex }} />
                  {p.name}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Custom hex:</span>
            <input type="color" value={hex} onChange={e => setHex(e.target.value)} className="h-8 w-8 cursor-pointer rounded" />
            <input type="color" value={hex2} onChange={e => setHex2(e.target.value)} className="h-8 w-8 cursor-pointer rounded" />
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Red/Blue)" className="h-8 w-40" />
            <GameButton size="sm" variant="primary" onClick={() => {
              if (!name.trim()) return;
              onAdd({ name: name.trim(), hex, hex2 });
              close();
            }}>Add custom</GameButton>
            <button onClick={() => { setMode("presets"); setPick1(null); }} className="text-xs text-muted-foreground hover:text-foreground">Back</button>
          </div>
        </div>
      )}
    </div>
  );
}

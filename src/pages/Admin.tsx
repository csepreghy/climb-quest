import { useState } from "react";
import { ThemeStudio } from "@/components/ThemeStudio";
import { GameCard } from "@/components/ui/game-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminAdjustChalk, useGame } from "@/game/store";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";

export default function Admin() {
  const s = useGame();
  const [amount, setAmount] = useState(100);
  return (
    <div className="space-y-6 animate-float-up max-w-4xl">
      <GameCard tone="legendary" className="p-5">
        <div className="menu-label mb-3">Admin · Chalk Controls</div>
        <div className="text-sm text-muted-foreground mb-3">Current balance: <span className="gradient-chalk-text font-bold tabular-nums">{s.chalk.toLocaleString()}</span></div>
        <div className="flex gap-2">
          <Input type="number" value={amount} min={1} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="max-w-32" />
          <Button variant="default" onClick={() => { adminAdjustChalk(amount); toast.success(`+${amount} Chalk`); }}>
            <Plus className="h-4 w-4" /> Add
          </Button>
          <Button variant="secondary" onClick={() => { adminAdjustChalk(-amount); toast.info(`-${amount} Chalk`); }}>
            <Minus className="h-4 w-4" /> Subtract
          </Button>
        </div>
      </GameCard>
      <div className="rpg-panel p-5" style={{ background: "hsl(var(--panel-fill))" }}>
        <ThemeStudio />
      </div>
    </div>
  );
}

import { useTheme, type ThemeAxis } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const SECTIONS: { axis: ThemeAxis; label: string; description: string }[] = [
  { axis: "box",    label: "Boxes",          description: "Card / panel surfaces" },
  { axis: "bg",     label: "Background",     description: "Page background — pastel, dark, and gradients" },
  { axis: "header", label: "Header color",   description: "Top bar fill (use the slider for opacity)" },
  { axis: "stage",  label: "Character stage",description: "Background panel behind the avatar" },
  { axis: "glow",   label: "Character glow", description: "Aura around the character" },
];

export function ThemeStudio({ compact = false }: { compact?: boolean }) {
  const { selections, set, options, headerOpacity, setHeaderOpacity } = useTheme();

  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      {SECTIONS.map(({ axis, label, description }) => {
        const list = options[axis];
        const active = selections[axis];
        return (
          <section key={axis} className="space-y-2">
            <div>
              <h2 className="font-display font-bold text-sm">{label}</h2>
              <p className="text-[11px] text-muted-foreground">{description}</p>
            </div>

            {axis === "header" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wider">Opacity</span>
                  <span className="tabular-nums font-bold">{Math.round(headerOpacity * 100)}%</span>
                </div>
                <Slider
                  value={[Math.round(headerOpacity * 100)]}
                  min={0} max={100} step={1}
                  onValueChange={(v) => setHeaderOpacity(v[0] / 100)}
                />
              </div>
            )}

            <div className={cn(
              "grid gap-1.5",
              compact ? "grid-cols-5 sm:grid-cols-6" : "grid-cols-4 sm:grid-cols-6 md:grid-cols-8",
            )}>
              {list.map(t => {
                const isActive = t.id === active;
                return (
                  <button
                    key={t.id}
                    onClick={() => set(axis, t.id)}
                    title={t.name}
                    className={cn(
                      "relative h-11 w-full border-2 transition-all flex items-end justify-center pb-0.5",
                      isActive
                        ? "border-foreground ring-2 ring-foreground/40 scale-105"
                        : "border-[hsl(var(--panel-frame))] hover:scale-105",
                    )}
                    style={{ background: t.swatch }}
                  >
                    {isActive && (
                      <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.8)]" />
                    )}
                    <span className="text-[8px] font-bold uppercase tracking-wider text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.85)] truncate max-w-full px-0.5">
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

import { Palette, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useTheme, type ThemeAxis } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";

const SECTIONS: { axis: ThemeAxis; label: string }[] = [
  { axis: "box",    label: "Boxes" },
  { axis: "bg",     label: "Background" },
  { axis: "header", label: "Header" },
  { axis: "stage",  label: "Character stage" },
];

export function ThemeSwitcher() {
  const { selections, set, options } = useTheme();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Customize theme"
          className="h-9 w-9 grid place-items-center rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary text-foreground hover:brightness-110 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)]"
        >
          <Palette className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3 max-h-[80vh] overflow-y-auto">
        {SECTIONS.map(({ axis, label }) => {
          const list = options[axis];
          const active = selections[axis];
          return (
            <div key={axis} className="mb-4 last:mb-0">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-semibold">
                {label}
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {list.map(t => {
                  const isActive = t.id === active;
                  return (
                    <button
                      key={t.id}
                      onClick={() => set(axis, t.id)}
                      title={t.name}
                      className={cn(
                        "relative h-9 w-full border transition-all",
                        isActive
                          ? "border-foreground ring-2 ring-foreground/30 scale-105"
                          : "border-[hsl(var(--panel-frame))] hover:scale-105",
                      )}
                      style={{ background: t.swatch }}
                    >
                      {isActive && (
                        <Check className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.7)]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="text-[10px] text-muted-foreground">Saved automatically.</div>
      </PopoverContent>
    </Popover>
  );
}

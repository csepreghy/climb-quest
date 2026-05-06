import { Palette, Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePanelTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setThemeId, themes } = usePanelTheme();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Choose panel theme"
          className="h-9 w-9 grid place-items-center rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary text-foreground hover:brightness-110 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)]"
        >
          <Palette className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 font-semibold">
          Panel theme
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {themes.map(t => {
            const active = t.id === theme.id;
            return (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-xs font-semibold border transition-colors text-left",
                  active
                    ? "border-[hsl(var(--panel-frame))] bg-secondary"
                    : "border-transparent hover:bg-secondary/60",
                )}
              >
                <span
                  className="h-5 w-5 shrink-0 border border-[hsl(var(--panel-frame))]"
                  style={{ background: t.swatch }}
                  aria-hidden
                />
                <span className="flex-1 truncate">{t.name}</span>
                {active && <Check className="h-3.5 w-3.5 text-foreground" />}
              </button>
            );
          })}
        </div>
        <div className="mt-2 text-[10px] text-muted-foreground">
          Saved automatically.
        </div>
      </PopoverContent>
    </Popover>
  );
}

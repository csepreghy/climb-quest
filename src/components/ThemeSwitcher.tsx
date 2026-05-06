import { useEffect, useState } from "react";
import { Settings, X } from "lucide-react";
import { ThemeStudio } from "@/components/ThemeStudio";
import { cn } from "@/lib/utils";

export function ThemeButton() {
  const [open, setOpen] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Theme studio"
        className={cn(
          "h-9 w-9 grid place-items-center rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary text-foreground hover:brightness-110",
          "shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)]",
          open && "ring-2 ring-foreground/40",
        )}
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div
          className="fixed top-20 right-4 z-50 w-[380px] max-h-[80vh] overflow-y-auto rpg-panel p-4 animate-pop-in"
          style={{ background: "hsl(var(--panel-fill))" }}
          role="dialog"
          aria-label="Theme studio"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-base">Theme Studio</h2>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="h-7 w-7 grid place-items-center rounded-md hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <ThemeStudio compact />
        </div>
      )}
    </>
  );
}

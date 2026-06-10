import { useState } from "react";
import { cn } from "@/lib/utils";
import { BEASTMAKER_1000_HOLDS, type HangboardHold } from "@/game/hangboard/beastmaker1000";
import boardImg from "@/assets/hangboard-beastmaker1000.jpg";

interface Props {
  /** Holds to render — defaults to the Beastmaker 1000 set. */
  holds?: HangboardHold[];
  /** Highlight one hold (used by the runner). */
  activeHoldId?: string | null;
  /** Called when a hold is tapped. If omitted, holds render as static overlays. */
  onSelect?: (hold: HangboardHold) => void;
  /** Optional max width wrapper class. */
  className?: string;
  /** Show numeric labels (size in mm or hold type) inside each button. */
  showLabels?: boolean;
  /** Admin/dev: toggle hold positioning helper outlines. */
  debug?: boolean;
}

export function HangboardOverlay({
  holds = BEASTMAKER_1000_HOLDS,
  activeHoldId,
  onSelect,
  className,
  showLabels = true,
  debug = false,
}: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const interactive = !!onSelect;

  return (
    <div className={cn("relative w-full max-w-2xl mx-auto select-none", className)}>
      <img
        src={boardImg}
        alt="Beastmaker 1000 hangboard"
        width={1024}
        height={1024}
        className="block w-full h-auto rounded-xl border-2 border-[hsl(var(--panel-frame))] shadow-lg"
        draggable={false}
      />
      <div className="absolute inset-0">
        {holds.map(h => {
          const isActive = h.id === activeHoldId;
          const isHover = h.id === hover;
          return (
            <button
              key={h.id}
              type="button"
              disabled={!interactive}
              onMouseEnter={() => setHover(h.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSelect?.(h)}
              aria-label={h.label}
              title={h.label}
              className={cn(
                "absolute rounded-lg transition-all",
                interactive && "cursor-pointer",
                isActive
                  ? "ring-4 ring-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/30 animate-pulse"
                  : isHover && interactive
                    ? "ring-2 ring-white/90 bg-white/10"
                    : debug
                      ? "ring-1 ring-cyan-400/70 bg-cyan-400/10"
                      : "ring-2 ring-white/0 hover:ring-white/60 bg-transparent",
              )}
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.w}%`,
                height: `${h.h}%`,
              }}
            >
              {showLabels && (isActive || isHover || debug) && (
                <span className="absolute inset-x-0 -bottom-5 text-[10px] sm:text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-center whitespace-nowrap">
                  {h.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

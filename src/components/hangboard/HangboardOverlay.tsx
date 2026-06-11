import { useState } from "react";
import { cn } from "@/lib/utils";
import { BEASTMAKER_1000_HOLDS, resolveHoldId, type HangboardHold } from "@/game/hangboard/beastmaker1000";
import boardAsset from "@/assets/hangboard-beastmaker1000.webp.asset.json";

interface Props {
  /** Holds to render — defaults to the Beastmaker 1000 set. */
  holds?: HangboardHold[];
  /** Highlight one hold (used by the runner). Both mirrored positions light up. */
  activeHoldId?: string | null;
  /** Called when a hold is tapped. If omitted, holds render as static overlays. */
  onSelect?: (hold: HangboardHold) => void;
  /** Optional max width wrapper class. */
  className?: string;
  /** Show numeric labels inside each button. */
  showLabels?: boolean;
  /** Admin/dev: outline every hold so positions are easy to tune. */
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
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<string | null>(null);
  const interactive = !!onSelect;
  const resolvedActiveId = activeHoldId ? resolveHoldId(activeHoldId) : null;

  return (
    <div className={cn("relative w-full max-w-3xl mx-auto select-none", className)}>
      <img
        src={boardAsset.url}
        alt="Beastmaker 1000 hangboard"
        width={1920}
        height={640}
        className="block w-full h-auto rounded-xl border-2 border-[hsl(var(--panel-frame))] shadow-lg"
        draggable={false}
      />
      <div className="absolute inset-0">
        {holds.flatMap(h => {
          const isActive = h.id === resolvedActiveId;
          const isHover = h.id === hoverId;
          return h.positions.map((p, i) => {
            const posKey = `${h.id}-${i}`;
            const showLabelHere = (isActive && i === 0) || hoverPos === posKey || (debug && i === 0);
            return (
              <button
                key={posKey}
                type="button"
                disabled={!interactive}
                onMouseEnter={() => { setHoverId(h.id); setHoverPos(posKey); }}
                onMouseLeave={() => { setHoverId(null); setHoverPos(null); }}
                onFocus={() => { setHoverId(h.id); setHoverPos(posKey); }}
                onBlur={() => { setHoverId(null); setHoverPos(null); }}
                onClick={() => onSelect?.(h)}
                aria-label={h.label}
                title={h.label}
                className={cn(
                  "absolute rounded-full transition-all flex items-center justify-center",
                  interactive && "cursor-pointer",
                  isActive
                    ? "ring-4 ring-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/30 animate-pulse"
                    : isHover && interactive
                      ? "ring-2 ring-white/90 bg-white/15"
                      : debug
                        ? "ring-1 ring-cyan-400/70 bg-cyan-400/10"
                        : "ring-2 ring-white/0 hover:ring-white/60 bg-transparent",
                )}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${p.w}%`,
                  height: `${p.h}%`,
                }}
              >
                {showLabels && (isActive || (isHover && interactive) || debug) && (
                  <span className="text-sm sm:text-base font-extrabold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] tabular-nums">
                    {h.number}
                  </span>
                )}
                {showLabels && showLabelHere && (
                  <span className="absolute inset-x-0 -bottom-5 text-[10px] sm:text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] text-center whitespace-nowrap">
                    {h.label}
                  </span>
                )}
              </button>
            );
          });
        })}
      </div>
    </div>
  );
}

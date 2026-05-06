import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "accent" | "legendary" | "boss" | "rare";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  interactive?: boolean;
  shimmer?: boolean;
  /** Show small corner rivets like a metal-trimmed game panel */
  rivets?: boolean;
}

export const GameCard = React.forwardRef<HTMLDivElement, Props>(
  ({ tone = "default", interactive, shimmer, rivets: _rivets, className, children, ...rest }, ref) => {
    void tone;
    void _rivets;
    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "rpg-panel",
          "transition-transform duration-200",
          interactive && "hover:-translate-y-0.5 cursor-pointer",
          className,
        )}
      >
        {shimmer && (
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden opacity-70">
            <div
              className="absolute inset-0 animate-shimmer-band"
              style={{
                background:
                  "linear-gradient(115deg, transparent 42%, hsl(46 90% 75% / 0.10) 50%, transparent 58%)",
                backgroundSize: "200% 100%",
              }}
            />
          </div>
        )}
        <div className="relative">{children}</div>
      </div>
    );
  },
);
GameCard.displayName = "GameCard";

/** Slim RPG XP / health bar with inset bevel. */
export function PixelBar({
  value,
  max = 100,
  color = "hsl(var(--xp))",
  className,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  segments?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div
      className={cn(
        "relative h-2.5 w-full rounded-full overflow-hidden",
        "bg-[hsl(26_18%_10%)]",
        "shadow-[inset_0_1px_2px_hsl(0_0%_0%/0.6),0_1px_0_hsl(38_30%_92%/0.06)]",
        "ring-1 ring-[hsl(28_28%_22%)]",
        className,
      )}
    >
      <div
        className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full"
        style={{
          width: `${pct * 100}%`,
          background: `linear-gradient(180deg, color-mix(in hsl, ${color} 80%, white 20%), ${color})`,
          boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.25), inset 0 -1px 0 hsl(0 0% 0% / 0.3)",
        }}
      />
    </div>
  );
}

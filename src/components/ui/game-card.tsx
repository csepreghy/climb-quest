import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "accent" | "legendary" | "boss" | "rare";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  /** Subtle hover lift */
  interactive?: boolean;
  /** Soft glow overlay (for legendary loot) */
  shimmer?: boolean;
}

const toneClasses: Record<Tone, string> = {
  default:   "border-border",
  accent:    "border-accent/40",
  legendary: "border-legendary/40",
  boss:      "border-boss/40",
  rare:      "border-rare/40",
};

const toneAccentBar: Record<Tone, string> = {
  default:   "bg-border/60",
  accent:    "bg-accent/70",
  legendary: "bg-legendary/70",
  boss:      "bg-boss/70",
  rare:      "bg-rare/70",
};

export const GameCard = React.forwardRef<HTMLDivElement, Props>(
  ({ tone = "default", interactive, shimmer, className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "relative rounded-xl border bg-card/80 backdrop-blur-sm",
          "shadow-[0_1px_0_0_hsl(0_0%_100%/0.04)_inset,0_8px_24px_-12px_hsl(0_0%_0%/0.6)]",
          "transition-transform duration-200",
          interactive && "hover:-translate-y-0.5 cursor-pointer",
          toneClasses[tone],
          className,
        )}
      >
        {/* Left accent rail for tone */}
        {tone !== "default" && (
          <div aria-hidden className={cn("absolute left-0 top-3 bottom-3 w-[2px] rounded-r", toneAccentBar[tone])} />
        )}
        {shimmer && (
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-xl overflow-hidden opacity-60">
            <div className="absolute inset-0 animate-shimmer-band" style={{
              background:
                "linear-gradient(115deg, transparent 40%, hsl(40 80% 80% / 0.08) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
            }} />
          </div>
        )}
        <div className="relative">{children}</div>
      </div>
    );
  },
);
GameCard.displayName = "GameCard";

/** Slim RPG-style XP / health bar */
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
    <div className={cn("relative h-2 w-full rounded-full border border-border/60 bg-secondary/60 overflow-hidden", className)}>
      <div className="absolute inset-y-0 left-0 transition-all duration-500 rounded-full" style={{ width: `${pct * 100}%`, background: color }} />
    </div>
  );
}

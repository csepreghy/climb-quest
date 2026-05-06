import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "accent" | "legendary" | "boss" | "rare";

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  /** Subtle hover lift */
  interactive?: boolean;
  /** Holographic shimmer overlay (for legendary loot) */
  shimmer?: boolean;
}

const toneClasses: Record<Tone, string> = {
  default:   "border-border [--gc-shadow:hsl(240_10%_2%)] [--gc-glow:transparent]",
  accent:    "border-accent/70 [--gc-shadow:hsl(280_80%_10%)] [--gc-glow:hsl(280_80%_60%/0.35)]",
  legendary: "border-legendary/70 [--gc-shadow:hsl(35_60%_10%)] [--gc-glow:hsl(35_95%_60%/0.35)]",
  boss:      "border-boss/70 [--gc-shadow:hsl(350_60%_10%)] [--gc-glow:hsl(350_80%_60%/0.35)]",
  rare:      "border-rare/70 [--gc-shadow:hsl(260_60%_10%)] [--gc-glow:hsl(260_85%_70%/0.35)]",
};

export const GameCard = React.forwardRef<HTMLDivElement, Props>(
  ({ tone = "default", interactive, shimmer, className, children, ...rest }, ref) => {
    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "relative rounded-xl border-[3px] bg-card/95 gradient-card",
          "shadow-[6px_6px_0_0_var(--gc-shadow),0_0_30px_0_var(--gc-glow)]",
          "transition-transform duration-150",
          interactive && "hover:-translate-y-1 hover:rotate-[-0.4deg] cursor-pointer",
          toneClasses[tone],
          className,
        )}
      >
        {/* Inner pixel-frame highlight */}
        <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[9px] ring-1 ring-inset ring-foreground/5" />
        {shimmer && (
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[9px] overflow-hidden">
            <div className="absolute inset-0 animate-shimmer-band" style={{
              background:
                "linear-gradient(115deg, transparent 30%, hsl(40 100% 80% / 0.18) 45%, hsl(280 100% 80% / 0.22) 50%, hsl(160 100% 70% / 0.18) 55%, transparent 70%)",
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

/** Segmented RPG-style XP / health bar */
export function PixelBar({
  value,
  max = 100,
  color = "hsl(var(--xp))",
  className,
  segments = 20,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  segments?: number;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div className={cn("relative h-3 w-full rounded-sm border-2 border-foreground/20 bg-secondary overflow-hidden", className)}>
      <div className="absolute inset-y-0 left-0 transition-all duration-500" style={{ width: `${pct * 100}%`, background: color }} />
      {/* Segment ticks */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: segments - 1 }).map((_, i) => (
          <div key={i} className="flex-1 border-r border-background/40" />
        ))}
        <div className="flex-1" />
      </div>
      {/* Scanline gloss */}
      <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 3px)",
      }} />
    </div>
  );
}

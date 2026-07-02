import { cn } from "@/lib/utils";
import type { Rarity } from "@/game/data";

const RARITY_GLOW: Record<string, string> = {
  common: "hsl(0 0% 100% / 0.85)",
  uncommon: "hsl(var(--uncommon))",
  rare: "hsl(var(--rare))",
  epic: "hsl(var(--epic))",
  legendary: "hsl(var(--legendary))",
  mythic: "hsl(var(--mythic))",
};

interface BadgeCardProps {
  image: string;
  name: string;
  have: boolean;
  rarity?: Rarity;
  variant?: "shine" | "token";
  size?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
  className?: string;
}

export function BadgeCard({
  image,
  name,
  have,
  rarity = "common",
  variant = "shine",
  size = "md",
  onClick,
  className,
}: BadgeCardProps) {
  const glowColor = RARITY_GLOW[rarity] ?? RARITY_GLOW.common;

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-20 w-20",
    lg: "h-24 w-24",
    xl: "h-28 w-28",
  };

  if (variant === "token") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "relative rounded-full",
          sizeClasses[size],
          onClick && "cursor-pointer",
          className
        )}
        style={{
          boxShadow:
            "0 4px 0 hsl(0 0% 18%), 0 8px 12px -4px hsl(0 0% 0% / 0.6)",
        }}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full overflow-hidden",
            !have && "opacity-40 grayscale"
          )}
        >
          {have && image ? (
            <img src={image} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs bg-[hsl(var(--panel-fill))]">
              ❔
            </div>
          )}
        </div>
        {/* Top shine */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, hsl(0 0% 100% / 0.25) 0%, hsl(0 0% 100% / 0.08) 35%, transparent 75%)",
            mixBlendMode: "screen",
          }}
        />
      </div>
    );
  }

  // Shine variant
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-full",
        sizeClasses[size],
        onClick && "cursor-pointer",
        className
      )}
      style={{
        ["--glow-color" as string]: glowColor,
        boxShadow: have
          ? `0 0 0 2px ${glowColor}, 0 0 20px -4px ${glowColor}, inset 0 1px 0 hsl(0 0% 100% / 0.15)`
          : `0 0 0 1px hsl(var(--border)), inset 0 1px 0 hsl(0 0% 100% / 0.08)`,
      }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full overflow-hidden bg-[hsl(var(--panel-fill))]",
          !have && "opacity-40 grayscale"
        )}
      >
        {have && image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs">❔</div>
        )}
      </div>
      {/* Gloss overlay */}
      <div
        className="absolute top-[6%] left-[6%] right-[6%] h-[22%] rounded-full pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, hsl(0 0% 100% / 0.32) 0%, hsl(0 0% 100% / 0.10) 40%, transparent 80%)",
          mixBlendMode: "screen",
        }}
      />
      {/* Ambient edge glow */}
      {have && (
        <div
          className="absolute -inset-1 rounded-full pointer-events-none opacity-60"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            filter: "blur(8px)",
          }}
        />
      )}
    </div>
  );
}

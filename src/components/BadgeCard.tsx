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
    md: "h-24 w-24",
    lg: "h-28 w-28",
    xl: "h-32 w-32",
  };

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
        boxShadow: have
          ? "0 0 0 2px hsl(0 0% 100%), 0 4px 12px -4px hsl(0 0% 0% / 0.5)"
          : "0 0 0 2px hsl(0 0% 100% / 0.55)",
      }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full overflow-hidden bg-[hsl(var(--panel-fill))]",
          !have && "opacity-40 grayscale"
        )}
      >
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs">❔</div>
        )}
      </div>
    </div>
  );
}

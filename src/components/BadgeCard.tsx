import { cn } from "@/lib/utils";
import type { Rarity } from "@/game/data";

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
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-24 w-24",
    lg: "h-28 w-28",
    xl: "h-32 w-32",
  };

  const borderColor = have
    ? `hsl(var(--${rarity}))`
    : `hsl(var(--${rarity}) / 0.55)`;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-full transition-transform duration-200 hover:scale-110",
        sizeClasses[size],
        onClick && "cursor-pointer",
        className
      )}
      style={{
        boxShadow: `0 0 0 3px ${borderColor}, 0 4px 12px -4px hsl(0 0% 0% / 0.5)`,
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

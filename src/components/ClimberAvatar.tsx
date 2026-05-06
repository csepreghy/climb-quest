import { LEVELS, ITEM_BY_ID, Gender } from "@/game/data";
import type { Equipped } from "@/game/store";
import { cn } from "@/lib/utils";

interface Props {
  level: number;
  gender: Gender;
  equipped?: Equipped;
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
}

const SIZE = {
  sm: "h-14 w-14 text-2xl",
  md: "h-24 w-24 text-4xl",
  lg: "h-36 w-36 text-6xl",
  xl: "h-48 w-48 text-7xl",
};

const GENDER_HUE: Record<Gender, string> = {
  male: "from-sky-500/40 to-indigo-700/40",
  female: "from-pink-500/40 to-fuchsia-700/40",
  neutral: "from-emerald-500/40 to-teal-700/40",
};

export function ClimberAvatar({ level, gender, equipped, size = "md", glow }: Props) {
  const lvl = LEVELS.find(l => l.level === level) ?? LEVELS[0];
  const auraId = equipped?.aura;
  const aura = auraId ? ITEM_BY_ID[auraId] : null;
  const outfit = equipped?.outfit ? ITEM_BY_ID[equipped.outfit] : null;
  const shoes = equipped?.shoes ? ITEM_BY_ID[equipped.shoes] : null;

  return (
    <div className={cn("relative inline-flex items-center justify-center", SIZE[size])}>
      {/* Aura */}
      {aura && (
        <div className="absolute inset-0 rounded-full blur-xl opacity-70 bg-gradient-to-tr from-accent to-legendary animate-chalk-pulse" />
      )}
      {glow && !aura && (
        <div className="absolute inset-0 rounded-full blur-xl opacity-40 bg-gradient-to-tr from-accent to-rare" />
      )}
      {/* Body */}
      <div className={cn(
        "relative h-full w-full rounded-full bg-gradient-to-br border-2 border-border shadow-card flex items-center justify-center overflow-hidden",
        GENDER_HUE[gender],
      )}>
        <span className="drop-shadow-lg">{lvl.emoji}</span>
      </div>
      {/* Item indicators */}
      <div className="absolute -bottom-1 -right-1 flex gap-0.5">
        {shoes && shoes.id !== "rental_shoes" && (
          <span className="text-xs bg-card/90 border border-border rounded-full px-1.5 py-0.5 backdrop-blur">{shoes.emoji}</span>
        )}
        {outfit && (
          <span className="text-xs bg-card/90 border border-border rounded-full px-1.5 py-0.5 backdrop-blur">{outfit.emoji}</span>
        )}
      </div>
      {/* Level chip */}
      <div className="absolute -top-1 -left-1 text-[10px] font-bold bg-accent text-accent-foreground rounded-full h-6 w-6 flex items-center justify-center border-2 border-background">
        {level}
      </div>
    </div>
  );
}

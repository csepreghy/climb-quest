import { LEVELS, ITEM_BY_ID, Gender } from "@/game/data";
import type { Equipped } from "@/game/store";
import { cn } from "@/lib/utils";
import { PixelSprite } from "./pixel/PixelSprite";
import { getClimberSprite } from "./pixel/sprites";

interface Props {
  level: number;
  gender: Gender;
  equipped?: Equipped;
  size?: "sm" | "md" | "lg" | "xl";
  glow?: boolean;
}

const PIXEL_SIZE = { sm: 4, md: 6, lg: 9, xl: 12 };
const FRAME_SIZE = { sm: "h-20 w-20", md: "h-28 w-28", lg: "h-40 w-40", xl: "h-48 w-48" };

export function ClimberAvatar({ level, gender, equipped, size = "md", glow }: Props) {
  const lvl = LEVELS.find(l => l.level === level) ?? LEVELS[0];
  const auraId = equipped?.aura;
  const aura = auraId ? ITEM_BY_ID[auraId] : null;
  const outfit = equipped?.outfit ? ITEM_BY_ID[equipped.outfit] : null;
  const shoes = equipped?.shoes ? ITEM_BY_ID[equipped.shoes] : null;
  const sprite = getClimberSprite(level, gender);

  const auraColor = aura
    ? "hsl(var(--legendary))"
    : glow
    ? "hsl(var(--accent))"
    : undefined;

  return (
    <div className={cn("relative inline-flex items-center justify-center", FRAME_SIZE[size])}>
      {/* Soft framed stage */}
      <div className="absolute inset-0 rounded-xl border border-border bg-gradient-to-b from-secondary/40 to-background overflow-hidden" />

      <PixelSprite sprite={sprite} pixel={PIXEL_SIZE[size]} aura={auraColor} className="relative z-10" />

      {/* Item indicator chips */}
      <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-20">
        {shoes && shoes.id !== "rental_shoes" && (
          <span className="text-xs bg-background/80 border border-border rounded px-1.5 py-0.5 backdrop-blur">{shoes.emoji}</span>
        )}
        {outfit && (
          <span className="text-xs bg-background/80 border border-border rounded px-1.5 py-0.5 backdrop-blur">{outfit.emoji}</span>
        )}
      </div>
      {/* Level chip */}
      <div className="absolute top-1.5 left-1.5 z-20 text-[11px] font-medium bg-background/85 border border-border rounded px-1.5 py-0.5 text-muted-foreground">
        Lv <span className="text-foreground">{level}</span>
      </div>
      <span className="sr-only">{lvl.title}</span>
    </div>
  );
}

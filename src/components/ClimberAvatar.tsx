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
const FRAME_SIZE = { sm: "h-20 w-20", md: "h-28 w-28", lg: "h-40 w-40", xl: "h-52 w-52" };

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
      {/* Pixel-platform "stage" */}
      <div className="absolute inset-0 rounded-2xl border-[3px] border-border bg-[radial-gradient(ellipse_at_top,hsl(280_30%_20%/0.6),hsl(240_10%_6%))] shadow-[6px_6px_0_0_hsl(240_10%_2%)] overflow-hidden">
        {/* checker floor */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 opacity-30" style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, hsl(280_30%_25%) 0 6px, hsl(240_10%_10%) 6px 12px)",
        }} />
      </div>

      <PixelSprite sprite={sprite} pixel={PIXEL_SIZE[size]} aura={auraColor} className="relative z-10" />

      {/* Item indicator chips */}
      <div className="absolute -bottom-2 -right-2 flex gap-0.5 z-20">
        {shoes && shoes.id !== "rental_shoes" && (
          <span className="text-xs bg-card/90 border-2 border-border rounded-md px-1.5 py-0.5 backdrop-blur shadow-[2px_2px_0_0_hsl(240_10%_2%)]">{shoes.emoji}</span>
        )}
        {outfit && (
          <span className="text-xs bg-card/90 border-2 border-border rounded-md px-1.5 py-0.5 backdrop-blur shadow-[2px_2px_0_0_hsl(240_10%_2%)]">{outfit.emoji}</span>
        )}
      </div>
      {/* Level chip */}
      <div className="absolute -top-2 -left-2 z-20 font-pixel text-[10px] bg-accent text-accent-foreground rounded-md h-7 w-7 flex items-center justify-center border-2 border-foreground/30 shadow-[2px_2px_0_0_hsl(240_10%_2%)]">
        {level}
      </div>
      {/* Title strip */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 font-pixel text-[8px] uppercase tracking-wider bg-background border-2 border-border rounded px-2 py-0.5 whitespace-nowrap text-shadow-pixel">
        Lv {level}
      </div>
      <span className="sr-only">{lvl.title}</span>
    </div>
  );
}

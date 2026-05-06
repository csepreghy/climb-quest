import { LEVELS, Gender } from "@/game/data";
import { getItem } from "@/game/customItems";
import type { Equipped } from "@/game/store";
import { cn } from "@/lib/utils";
import { PixelSprite } from "./pixel/PixelSprite";
import { getClimberSprite } from "./pixel/sprites";
import climberMale1 from "@/assets/climber-male-1.png";

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
  const aura = auraId ? getItem(auraId) : null;
  const outfit = equipped?.outfit ? getItem(equipped.outfit) : null;
  const shoes = equipped?.shoes ? getItem(equipped.shoes) : null;
  const sprite = getClimberSprite(level, gender);

  // Use themed glow var; aura item forces legendary gold; otherwise honor user's chosen glow.
  const showGlow = !!aura || !!glow;
  const auraColor = aura ? "hsl(var(--legendary))" : "hsl(var(--avatar-glow-color, 42 100% 65%))";
  const auraOpacity = aura ? 0.85 : "var(--avatar-glow-opacity, 0)";

  const useIllustration = level === 1 && gender === "male";
  const itemChips = [
    shoes && shoes.id !== "rental_shoes" ? shoes.emoji : null,
    outfit ? outfit.emoji : null,
  ].filter(Boolean);

  return (
    <div className={cn("relative inline-flex items-center justify-center", FRAME_SIZE[size])}>
      <div
        className="absolute inset-0 rounded-xl border border-[hsl(var(--panel-frame))] overflow-hidden"
        style={{ background: "var(--avatar-stage, transparent)" }}
      />

      {showGlow && (
        <div
          className="absolute -inset-1 rounded-full blur-2xl animate-aura-pulse z-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${auraColor} 0%, transparent 65%)`,
            opacity: auraOpacity as string,
          }}
        />
      )}

      {useIllustration ? (
        <img
          src={climberMale1}
          alt={lvl.title}
          className="relative z-10 h-[92%] w-[92%] object-contain drop-shadow-[0_3px_0_hsl(0_0%_0%/0.35)]"
        />
      ) : (
        <PixelSprite sprite={sprite} pixel={PIXEL_SIZE[size]} aura={auraColor} className="relative z-10" />
      )}

      {/* Item indicator chips */}
      {itemChips.length > 0 && (
        <div className="absolute bottom-1.5 right-1.5 z-20 flex gap-1 pointer-events-none isolate [backface-visibility:hidden]">
          {itemChips.map((emoji, index) => (
            <span key={`${emoji}-${index}`} className="text-xs leading-none bg-background border border-border rounded px-1.5 py-1 shadow-sm">
              {emoji}
            </span>
          ))}
        </div>
      )}
      {/* Level chip */}
      <div className="absolute top-1.5 left-1.5 z-20 text-[11px] font-medium bg-background/85 border border-border rounded px-1.5 py-0.5 text-muted-foreground">
        Lv <span className="text-foreground">{level}</span>
      </div>
      <span className="sr-only">{lvl.title}</span>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import pickBoulderImg from "@/assets/log-pick-boulder.webp";
import pullup4 from "@/assets/strength-pullup-4.webp";
import hangboardPickImg from "@/assets/log-hangboard.webp.asset.json";
import boardMoonAsset from "@/assets/board-moonboard.png.asset.json";

export type QuickPickMode = "boulder-pick" | "strength" | "board";

type Tile = {
  key: "boulder" | "strength" | "hangboard" | "board";
  label: string;
  image: string;
  ring: string;
};

const TILES: Tile[] = [
  { key: "boulder",   label: "Boulder",   image: pickBoulderImg,        ring: "ring-[hsl(var(--btn-green))]/60" },
  { key: "strength",  label: "Strength",  image: pullup4,               ring: "ring-[hsl(var(--sky))]/60" },
  { key: "hangboard", label: "Hangboard", image: hangboardPickImg.url,  ring: "ring-[hsl(270_80%_65%)]/60" },
  { key: "board",     label: "Board",     image: boardMoonAsset.url,    ring: "ring-[hsl(var(--epic))]/60" },
];

export function TrainingQuickPicker({
  onPick,
  className,
}: {
  onPick: (mode: QuickPickMode) => void;
  className?: string;
}) {
  const navigate = useNavigate();

  function handle(t: Tile) {
    if (t.key === "boulder") onPick("boulder-pick");
    else if (t.key === "strength") onPick("strength");
    else if (t.key === "board") onPick("board");
    else if (t.key === "hangboard") navigate("/hangboard");
  }

  return (
    <div className={cn("grid grid-cols-4 gap-2 sm:gap-3 lg:grid-cols-2 lg:w-[300px]", className)}>
      {TILES.map(t => (
        <button
          key={t.key}
          type="button"
          onClick={() => handle(t)}
          className={cn(
            "group relative overflow-hidden rounded-xl border-2 border-[hsl(var(--panel-frame))] bg-secondary/50",
            "shadow-[inset_0_2px_0_hsl(0_0%_100%/0.06),inset_0_-3px_0_hsl(0_0%_0%/0.4),0_8px_18px_-10px_hsl(0_0%_0%/0.6)]",
            "aspect-square w-full hover:ring-4 transition active:translate-y-[2px]",
            t.ring,
          )}
          aria-label={`Log ${t.label}`}
        >
          <img
            src={t.image}
            alt={t.label}
            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-2 py-1.5 text-center font-display font-bold text-xs sm:text-sm text-white">
            {t.label}
          </span>
        </button>
      ))}
    </div>
  );
}

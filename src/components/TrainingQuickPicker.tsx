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
};

const TILES: Tile[] = [
  { key: "boulder",   label: "Boulder",   image: pickBoulderImg },
  { key: "strength",  label: "Strength",  image: pullup4 },
  { key: "hangboard", label: "Hangboard", image: hangboardPickImg.url },
  { key: "board",     label: "Board",     image: boardMoonAsset.url },
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
    <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-2 lg:w-[300px]", className)}>
      {TILES.map(t => (
      <button
          key={t.key}
          type="button"
          onClick={() => handle(t)}
          className={cn(
            "tile-3d group relative overflow-hidden cursor-pointer",
            "aspect-[4/5] w-full hover:-translate-y-0.5 transition active:translate-y-[2px]",
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

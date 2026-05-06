import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface SpriteDef {
  /** Each row is a string of single chars separated by spaces, rows separated by newlines */
  grid: string;
  /** Map of char -> css color (hex / hsl / var). "." or " " is transparent. */
  palette: Record<string, string>;
}

interface Props {
  sprite: SpriteDef;
  /** Pixel size in CSS px (each grid cell becomes size x size). Default 6. */
  pixel?: number;
  className?: string;
  /** subtle bobbing idle animation */
  idle?: boolean;
  /** Optional aura color behind sprite */
  aura?: string;
  /** Optional outline color (drawn 1 px around opaque pixels) */
  outline?: string;
}

export function PixelSprite({ sprite, pixel = 6, className, idle = true, aura, outline }: Props) {
  const { rows, cols, rects } = useMemo(() => parseSprite(sprite), [sprite]);
  const w = cols * pixel;
  const h = rows * pixel;

  return (
    <div className={cn("relative inline-block", idle && "animate-sprite-bob", className)} style={{ width: w, height: h }}>
      {aura && (
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-70 animate-aura-pulse"
          style={{ background: `radial-gradient(circle, ${aura} 0%, transparent 65%)` }}
        />
      )}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${cols} ${rows}`}
        shapeRendering="crispEdges"
        className="relative block"
        style={{ imageRendering: "pixelated" }}
      >
        {outline && rects.map((r, i) => (
          <rect key={"o"+i} x={r.x - 0.06} y={r.y - 0.06} width={1.12} height={1.12} fill={outline} />
        ))}
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={1} height={1} fill={r.fill} />
        ))}
      </svg>
    </div>
  );
}

function parseSprite(s: SpriteDef) {
  const rawRows = s.grid.replace(/\r/g, "").split("\n").map(r => r.trim()).filter(Boolean);
  const rects: { x: number; y: number; fill: string }[] = [];
  let cols = 0;
  rawRows.forEach((row, y) => {
    const cells = row.split(/\s+/);
    cols = Math.max(cols, cells.length);
    cells.forEach((c, x) => {
      if (c === "." || c === "" || c === "_") return;
      const fill = s.palette[c];
      if (!fill) return;
      rects.push({ x, y, fill });
    });
  });
  return { rows: rawRows.length, cols, rects };
}

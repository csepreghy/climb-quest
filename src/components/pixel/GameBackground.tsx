import { useMemo } from "react";
import { PixelSprite } from "./PixelSprite";
import { HOLD_SPRITE } from "./sprites";

/** Scatters bouldering holds + chalk dust across a fixed background layer. */
export function GameBackground() {
  const holds = useMemo(() => {
    const arr: { x: number; y: number; size: number; rot: number; opacity: number }[] = [];
    for (let i = 0; i < 22; i++) {
      arr.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 3 + Math.floor(Math.random() * 4),
        rot: Math.floor(Math.random() * 4) * 90,
        opacity: 0.18 + Math.random() * 0.22,
      });
    }
    return arr;
  }, []);

  const dust = useMemo(() => {
    const arr: { left: number; delay: number; dur: number; size: number }[] = [];
    for (let i = 0; i < 14; i++) {
      arr.push({
        left: Math.random() * 100,
        delay: Math.random() * 12,
        dur: 14 + Math.random() * 14,
        size: 2 + Math.random() * 3,
      });
    }
    return arr;
  }, []);

  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Wall texture: dithered dark gradient + noise */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(280_50%_18%/0.5),transparent_60%),radial-gradient(ellipse_at_bottom_right,hsl(220_50%_18%/0.4),transparent_60%)]" />
      <div className="absolute inset-0 opacity-[0.08]" style={{
        backgroundImage:
          "repeating-linear-gradient(0deg, transparent 0 3px, rgba(255,255,255,0.04) 3px 4px), repeating-linear-gradient(90deg, transparent 0 3px, rgba(255,255,255,0.04) 3px 4px)",
      }} />
      {/* Scattered pixel holds */}
      {holds.map((h, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            transform: `rotate(${h.rot}deg)`,
            opacity: h.opacity,
          }}
        >
          <PixelSprite sprite={HOLD_SPRITE} pixel={h.size} idle={false} />
        </div>
      ))}
      {/* Chalk dust */}
      {dust.map((d, i) => (
        <span
          key={i}
          className="absolute bottom-[-20px] rounded-full bg-chalk/40 animate-chalk-drift"
          style={{
            left: `${d.left}%`,
            width: d.size,
            height: d.size,
            animationDelay: `-${d.delay}s`,
            animationDuration: `${d.dur}s`,
            filter: "blur(1px)",
          }}
        />
      ))}
      {/* Vignette + scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(240_10%_4%/0.85)_100%)]" />
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay" style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0 1px, transparent 1px 3px)",
      }} />
    </div>
  );
}

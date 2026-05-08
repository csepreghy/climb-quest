import { useEffect, useState } from "react";
import chalkBagImg from "@/assets/chalk-bag.png";

interface BadgeData {
  name: string;
  emoji: string;
  chalk: number;
}

let trigger: (d: BadgeData) => void = () => {};
const queue: BadgeData[] = [];
let showing = false;

export function showBadgeUnlock(name: string, emoji: string, chalk: number) {
  queue.push({ name, emoji, chalk });
  pump();
}

function pump() {
  if (showing) return;
  const next = queue.shift();
  if (!next) return;
  showing = true;
  trigger(next);
  window.setTimeout(() => {
    showing = false;
    pump();
  }, 3000);
}

const PARTICLES = Array.from({ length: 80 }, (_, i) => i);

export function BadgeUnlockBanner() {
  const [data, setData] = useState<BadgeData | null>(null);

  useEffect(() => {
    trigger = (d) => {
      setData(d);
      window.setTimeout(() => setData(null), 2800);
    };
    return () => { trigger = () => {}; };
  }, []);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm animate-fade-overlay" />

      {/* Chalk powder burst */}
      <div className="absolute inset-0 grid place-items-center">
        {PARTICLES.map(i => {
          const angle = (i / PARTICLES.length) * Math.PI * 2 + (i % 5) * 0.17;
          const dist = 160 + (i * 53 % 280);
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist - 30;
          const size = 6 + (i % 6) * 3;
          const delay = (i % 10) * 25;
          return (
            <span
              key={i}
              className="absolute rounded-full bg-white animate-chalk-poof"
              style={{
                width: size,
                height: size,
                filter: "blur(2px)",
                opacity: 0.9,
                ["--dx" as any]: `${dx}px`,
                ["--dy" as any]: `${dy}px`,
                animationDelay: `${delay}ms`,
              }}
            />
          );
        })}
      </div>

      <div className="relative animate-banner-pop text-center px-8 py-6 rounded-xl border border-legendary/40 bg-card/95 shadow-[0_20px_60px_-20px_hsl(35_95%_60%/0.4)]">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Badge Unlocked</div>
        <div className="mt-3 text-6xl sm:text-7xl leading-none animate-pop-in">{data.emoji}</div>
        <div className="font-display font-semibold text-2xl sm:text-3xl mt-3 gradient-chalk-text">{data.name}</div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <img src={chalkBagImg} alt="Chalk" className="h-8 w-8 object-contain drop-shadow-[0_4px_12px_hsl(var(--chalk-glow)/0.6)]" />
          <span className="text-2xl font-bold gradient-chalk-text tabular-nums">+{data.chalk}</span>
        </div>
      </div>
    </div>
  );
}

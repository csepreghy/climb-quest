import { useEffect, useState } from "react";
import { Flame, Zap, Target, ShieldPlus, Sparkles } from "lucide-react";
import { onStreakEvent } from "@/game/streak";
import chalkBagImg from "@/assets/chalk-bag.png";

interface BannerData {
  label: string;
  buffs?: { kind: "chalk" | "crit" | "cap"; pct: number; days: number }[];
  chalkCache?: number;
}

let trigger: (d: BannerData) => void = () => {};

/** Programmatic show (in addition to listening to streak events). */
export function showStreakMilestone(d: BannerData) { trigger(d); }

const PARTICLES = Array.from({ length: 60 }, (_, i) => i);

export function StreakMilestoneBanner() {
  const [data, setData] = useState<BannerData | null>(null);

  useEffect(() => {
    trigger = d => {
      setData(d);
      window.setTimeout(() => setData(null), 3600);
    };
    // Also react to plain string streak events (no payload) — keep them visible too.
    const off = onStreakEvent(label => {
      setData(prev => prev ?? { label });
      window.setTimeout(() => setData(null), 3600);
    });
    return () => { trigger = () => {}; off(); };
  }, []);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-background/55 backdrop-blur-sm animate-fade-overlay" />

      {/* Confetti / chalk burst */}
      <div className="absolute inset-0 grid place-items-center">
        {PARTICLES.map(i => {
          const angle = (i / PARTICLES.length) * Math.PI * 2 + (i % 4) * 0.21;
          const dist = 140 + (i * 47 % 260);
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist - 20;
          const size = 5 + (i % 5) * 3;
          const delay = (i % 10) * 30;
          return (
            <span
              key={i}
              className="absolute rounded-full bg-[hsl(var(--btn-orange))] animate-chalk-poof"
              style={{
                width: size,
                height: size,
                filter: "blur(1.5px)",
                opacity: 0.85,
                ["--dx" as any]: `${dx}px`,
                ["--dy" as any]: `${dy}px`,
                animationDelay: `${delay}ms`,
              }}
            />
          );
        })}
      </div>

      <div className="relative animate-banner-pop text-center px-7 py-6 rounded-xl border border-[hsl(var(--btn-orange))]/60 bg-card/95 shadow-[0_20px_60px_-20px_hsl(20_95%_55%/0.6)] max-w-sm">
        <div className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[hsl(var(--btn-orange))]">
          <Flame className="h-3.5 w-3.5" />
          Streak Milestone
        </div>
        <div className="font-display font-semibold text-2xl mt-2 gradient-chalk-text">
          {data.label}
        </div>

        {data.chalkCache != null && data.chalkCache > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-chalk-glow/50 bg-chalk-glow/10">
            <img src={chalkBagImg} alt="" className="h-5 w-5 object-contain" />
            <span className="font-bold tabular-nums gradient-chalk-text">+{data.chalkCache.toLocaleString()}</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Chalk Cache</span>
          </div>
        )}

        {data.buffs && data.buffs.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {data.buffs.map((b, i) => {
              const Icon = b.kind === "chalk" ? Zap : b.kind === "crit" ? Target : ShieldPlus;
              const label = b.kind === "chalk" ? "Chalk" : b.kind === "crit" ? "Crit" : "Daily cap";
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border border-chalk-glow/50 bg-chalk-glow/10 text-chalk-glow"
                >
                  <Icon className="h-3 w-3" />
                  +{b.pct}% {label} · {b.days}d
                </span>
              );
            })}
          </div>
        )}

        {(!data.buffs || data.buffs.length === 0) && !data.chalkCache && (
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--btn-orange))]" />
            Keep climbing to stack rewards.
          </div>
        )}
      </div>
    </div>
  );
}

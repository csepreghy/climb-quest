import { useEffect, useState } from "react";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import type { Gender } from "@/game/data";
import { ArrowRight } from "lucide-react";

interface BannerData {
  title: string;
  unlocks: string[];
  fromLevel?: number;
  toLevel?: number;
  fromTitle?: string;
  gender?: Gender;
}

let trigger: (d: BannerData) => void = () => {};

export function showLevelUpBanner(
  title: string,
  unlocks: string[],
  extra?: { fromLevel?: number; toLevel?: number; fromTitle?: string; gender?: Gender },
) {
  trigger({ title, unlocks, ...extra });
}

const PARTICLES = Array.from({ length: 80 }, (_, i) => i);

export function LevelUpBanner() {
  const [data, setData] = useState<BannerData | null>(null);

  useEffect(() => {
    trigger = (d) => {
      setData(d);
      window.setTimeout(() => setData(null), 2800);
    };
    return () => { trigger = () => {}; };
  }, []);

  if (!data) return null;

  const showAvatars = data.fromLevel != null && data.toLevel != null && data.gender;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center pointer-events-none overflow-hidden">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm animate-fade-overlay" />

      {/* Chalk powder burst */}
      <div className="absolute inset-0 grid place-items-center">
        {PARTICLES.map(i => {
          const angle = (i / PARTICLES.length) * Math.PI * 2 + (i % 3) * 0.2;
          const dist = 180 + (i % 5) * 40;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist - 40;
          const size = 8 + (i % 4) * 4;
          const delay = (i % 6) * 30;
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
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Level Up</div>

        {showAvatars && (
          <div className="mt-3 flex items-center justify-center gap-3 sm:gap-4">
            <div className="flex flex-col items-center gap-1 opacity-70">
              <ClimberAvatar level={data.fromLevel!} gender={data.gender!} size="md" />
              <div className="text-[10px] text-muted-foreground">Lv {data.fromLevel}{data.fromTitle ? ` · ${data.fromTitle}` : ""}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-[hsl(var(--btn-orange))] animate-pulse" />
            <div className="flex flex-col items-center gap-1">
              <ClimberAvatar level={data.toLevel!} gender={data.gender!} size="md" glow />
              <div className="text-[10px] text-foreground font-semibold">Lv {data.toLevel}</div>
            </div>
          </div>
        )}

        <div className="font-display font-semibold text-2xl sm:text-3xl mt-3 gradient-chalk-text">{data.title}</div>
        {data.unlocks.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
            Unlocked: {data.unlocks.join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

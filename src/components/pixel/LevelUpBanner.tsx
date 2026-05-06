import { useEffect, useState } from "react";

let trigger: (title: string, unlocks: string[]) => void = () => {};

export function showLevelUpBanner(title: string, unlocks: string[]) {
  trigger(title, unlocks);
}

export function LevelUpBanner() {
  const [data, setData] = useState<{ title: string; unlocks: string[] } | null>(null);

  useEffect(() => {
    trigger = (title, unlocks) => {
      setData({ title, unlocks });
      window.setTimeout(() => setData(null), 2400);
    };
    return () => { trigger = () => {}; };
  }, []);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center pointer-events-none">
      <div className="absolute inset-0 bg-background/50 backdrop-blur-sm animate-fade-overlay" />
      <div className="relative animate-banner-pop text-center px-8 py-6 rounded-xl border border-legendary/40 bg-card/95 shadow-[0_20px_60px_-20px_hsl(35_95%_60%/0.4)]">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Level Up</div>
        <div className="font-display font-semibold text-2xl sm:text-3xl mt-2 gradient-chalk-text">{data.title}</div>
        {data.unlocks.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
            Unlocked: {data.unlocks.join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

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
      window.setTimeout(() => setData(null), 2800);
    };
    return () => { trigger = () => {}; };
  }, []);

  if (!data) return null;

  // 24 confetti pieces
  const confetti = Array.from({ length: 28 });

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center pointer-events-none">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-[2px] animate-fade-overlay" />
      {confetti.map((_, i) => (
        <span
          key={i}
          className="absolute top-1/2 left-1/2 w-2 h-2 animate-confetti-burst"
          style={{
            background: ["#ffd83a","#7adfff","#ff7aa8","#7aff7a","#fff"][i % 5],
            ["--cx" as string]: `${(Math.cos((i / 28) * Math.PI * 2) * (180 + Math.random()*120)).toFixed(0)}px`,
            ["--cy" as string]: `${(Math.sin((i / 28) * Math.PI * 2) * (180 + Math.random()*120)).toFixed(0)}px`,
            animationDelay: `${(i % 6) * 30}ms`,
          }}
        />
      ))}
      <div className="relative animate-banner-pop text-center">
        <div className="font-pixel text-3xl sm:text-5xl gradient-chalk-text drop-shadow-[0_4px_0_hsl(280_80%_20%)]">LEVEL UP!</div>
        <div className="mt-3 font-pixel text-base sm:text-xl text-legendary">{data.title}</div>
        {data.unlocks.length > 0 && (
          <div className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-md mx-auto px-4">
            Unlocked: {data.unlocks.join(" · ")}
          </div>
        )}
      </div>
    </div>
  );
}

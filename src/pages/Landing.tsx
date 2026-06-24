import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GameButton } from "@/components/ui/game-button";
import { GameCard, PixelBar } from "@/components/ui/game-card";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { PickCard } from "@/components/pixel/PickCard";
import { LevelPreviewCard } from "@/components/LevelPreviewCard";
import { ShopPreviewTile } from "@/components/pixel/ShopPreviewTile";
import { LEVELS, ShopItem } from "@/game/data";
import { useAllItems } from "@/game/customItems";
import { RARITY_BORDER } from "@/game/data";
import { isImageEmoji } from "@/game/customItems";
import { SmartImage } from "@/components/SmartImage";
import { Trophy, ScrollText as ScrollIcon, Swords as SwordIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resolvedLevel, useLevelOverrides } from "@/game/levelOverrides";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ArrowRight, ScrollText, Sparkles, ArrowUp, Swords } from "lucide-react";
import logoImg from "@/assets/climbquest-logo.png";
import boulderImg from "@/assets/log-boulder.webp";
import bossImg from "@/assets/log-boss.webp";
import crystalCaveImg from "@/assets/boss-crystal-cave.png";
import chalkBagImg from "@/assets/chalk-bag.png";

import { LoadingScreen } from "@/components/LoadingScreen";

export default function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  if (loading) return <LoadingScreen />;
  if (user) return <Navigate to="/home" replace />;
  const goAuth = () => nav("/auth");


  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[hsl(var(--background))]" style={{ backgroundImage: "radial-gradient(ellipse at top, hsl(var(--background)) 0%, hsl(0 0% 4%) 100%)" }}>
      <BackgroundOrbs />

      {/* Top bar */}
      <header className="relative z-10" style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}>
        <div className="container flex items-center justify-between gap-4 py-5">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logoImg}
              alt="ClimbQuest"
              className="h-16 sm:h-20 lg:h-24 w-auto transition-transform group-hover:rotate-[-4deg] drop-shadow-[0_2px_6px_hsl(0_0%_0%/0.55)]"
            />
          </Link>
          <div className="flex items-center gap-2">
            <GameButton variant="primary" size="sm" onClick={goAuth}>
              Start climbing <ArrowRight className="h-4 w-4" />
            </GameButton>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 container pt-6 pb-20 sm:pt-12 sm:pb-28">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
          <div className="space-y-6 animate-float-up">
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary/70 text-foreground/90 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.06),inset_0_-1px_0_hsl(0_0%_0%/0.5)]">
              <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--btn-orange))]" />
              For every climber level
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] space-y-1">
              <span className="block">Log climbs,</span>
              <span className="block">earn <img src={chalkBagImg} alt="chalk" className="inline-block h-[0.9em] w-auto align-[-0.1em] mx-1 drop-shadow-[0_2px_4px_hsl(42_100%_55%/0.4)]" />,</span>
              <span className="block">level up.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              ClimbQuest is a climbing tracker that plays like an RPG. Track your progress, defeat Boss Projects. Bouldering tracking made fun.
            </p>
            <div className="flex flex-wrap gap-3">
              <GameButton variant="success" size="lg" onClick={goAuth}>
                Get started <ArrowRight className="h-4 w-4" />
              </GameButton>
              <GameButton variant="ghost" size="lg" onClick={() => { document.getElementById("how")?.scrollIntoView({ behavior: "smooth" }); }}>
                See how it works
              </GameButton>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 bg-[hsl(var(--btn-orange))]/15 blur-3xl rounded-[2rem] pointer-events-none" aria-hidden />
            <Showcase />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 container pb-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">One app. Every send.</h2>
          <p className="text-muted-foreground mt-2">From the first slab to your hardest overhang.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <PickCard
            image={boulderImg}
            title="1. Log climbs"
            desc="Every boulder, attempt, and flash and grade easily saved."
            ring="ring-[hsl(var(--btn-green))]/60"
          />
          <PickCard
            content={
              <img
                src={chalkBagImg}
                alt="Chalk bag"
                loading="lazy"
                className="h-[45%] w-[45%] object-contain drop-shadow-[0_8px_20px_hsl(42_100%_55%/0.4)]"
              />
            }
            title="2. Earn Chalk"
            desc="Style bonuses, equipped gear, and consumables stack into XP."
            ring="ring-[hsl(var(--btn-orange))]/60"
          />
          <PickCard
            content={
              <div className="scale-110">
                <ClimberAvatar level={9} gender="male" equipped={{} as any} size="xl" glow />
              </div>
            }
            title="3. Level up"
            desc="Unlock new avatars, items, badges, and gear slots."
            ring="ring-[hsl(var(--accent))]/60"
          />
        </div>
      </section>

      {/* Shop Preview */}
      <section className="relative z-10 container pb-24">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">A loot-filled shop</h2>
          <p className="text-muted-foreground mt-2">Outfits, brushes, power-ups & climbing buddies — earned with Chalk.</p>
        </div>
        <ShopPreviewGrid />
        <div className="mt-6 flex justify-center">
          <GameButton variant="primary" size="lg" onClick={goAuth}>
            Start earning Chalk <ArrowRight className="h-4 w-4" />
          </GameButton>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="relative z-10 container pb-24">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary/70 text-foreground/90">
            <Trophy className="h-3.5 w-3.5 text-legendary" />
            Climbers worldwide
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mt-3">Top of the leaderboard</h2>
          <p className="text-muted-foreground mt-2">Climb your way up by logging sends and bossing projects.</p>
        </div>
        <LeaderboardPreview onSignUp={goAuth} />
      </section>

      {/* Final CTA */}

      <section className="relative z-10 container pb-20">
        <GameCard tone="accent" className="p-8 sm:p-12 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Ready to send?</h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Free to start. Your projects, your gear, your story.
          </p>
          <div className="mt-6 flex justify-center">
            <GameButton variant="primary" size="lg" onClick={goAuth}>
              Start climbing <ArrowRight className="h-4 w-4" />
            </GameButton>
          </div>
        </GameCard>
      </section>

      <footer className="relative z-10 border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} ClimbQuest
      </footer>
    </div>
  );
}

/* ---------------- Showcase ---------------- */

const SLIDE_LABELS = ["Unlock Characters", "Buy Gear", "Log Climbs", "Defeat Boss Projects", "Level Up"];

function Showcase() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIdx(i => (i + 1) % SLIDE_LABELS.length), 3800);
    return () => clearInterval(t);
  }, [paused]);

  const slides = [<CharactersSlide />, <ItemsSlide />, <LogSlide />, <BossSlide />, <LevelUpSlide />];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="space-y-3"
    >
      <GameCard className="p-5 sm:p-6">
        <div className="font-display font-bold text-xl sm:text-2xl tracking-tight mb-3">
          {SLIDE_LABELS[idx]}
        </div>
        <div className="min-h-[420px] sm:min-h-[460px] grid place-items-center">
          <div key={idx} className="w-full animate-fade-in">{slides[idx]}</div>
        </div>
      </GameCard>
      <div className="flex justify-center gap-2">
        {SLIDE_LABELS.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Slide ${i + 1}`}
            onClick={() => setIdx(i)}
            className={cn(
              "h-2 rounded-full border border-[hsl(var(--panel-frame))] transition-all",
              i === idx ? "w-6 bg-[hsl(var(--btn-orange))]" : "w-2 bg-secondary"
            )}
          />
        ))}
      </div>
    </div>
  );
}

function CharactersSlide() {
  const overrides = useLevelOverrides();
  // Build up to 12 slots cycling levels & genders, only those with custom images.
  const slots = useMemo(() => {
    const out: { level: number; gender: "male" | "female" }[] = [];
    for (let lvl = 1; lvl <= 10; lvl++) {
      for (const g of ["male", "female"] as const) {
        const r = resolvedLevel(lvl, g);
        if (r.image) out.push({ level: lvl, gender: g });
      }
    }
    // Shuffle (Fisher-Yates) then take 12.
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out.slice(0, 12);
  }, [overrides]);

  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (slots.length === 0) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setShown(s => {
        if (s >= slots.length) {
          // hold the full set for 1s, then no more updates
          return s;
        }
        t = setTimeout(tick, 180);
        return s + 1;
      });
    };
    t = setTimeout(tick, 180);
    return () => clearTimeout(t);
  }, [slots.length]);

  if (slots.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-10">
        Ten levels. Male & female sprites. Custom art for every tier.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-4 sm:gap-6">
        {slots.map((s, i) => (
          <div
            key={`${s.level}-${s.gender}-${i}`}
            className={cn(
              "transition-all duration-500",
              i < shown ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-75 translate-y-2"
            )}
          >
            <div className="scale-[0.6] sm:scale-[0.75] origin-center -m-3">
              <ClimberAvatar level={s.level} gender={s.gender} equipped={{} as any} size="lg" />
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-muted-foreground">10 levels · male & female · unique art</div>
    </div>
  );
}

function ItemsSlide() {
  const all = useAllItems();
  const [shuffleKey, setShuffleKey] = useState(0);

  // Pick 6, randomized — only re-shuffles when shuffleKey changes
  // (or once items first become available).
  const [picks, setPicks] = useState<ShopItem[]>([]);
  useEffect(() => {
    if (all.length === 0) return;
    if (picks.length > 0 && shuffleKey === 0) return; // keep first selection stable
    const shuffled = [...all].sort(() => Math.random() - 0.5);
    const leg = shuffled.filter(i => i.rarity === "legendary").slice(0, 1);
    const epic = shuffled.filter(i => i.rarity === "epic").slice(0, 2);
    const rare = shuffled.filter(i => i.rarity === "rare").slice(0, 2);
    const picked = [...leg, ...epic, ...rare];
    const rest = shuffled.filter(i => !picked.includes(i));
    setPicks([...picked, ...rest].slice(0, 6));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.length, shuffleKey]);

  // Fetch images for ONLY those ids (small payload).
  const [imgs, setImgs] = useState<Record<string, string>>({});
  useEffect(() => {
    if (picks.length === 0) return;
    const ids = picks.map(p => p.id);
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("shop_items").select("id,image").in("id", ids);
      if (cancelled) return;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => { if (r.image) map[r.id] = r.image; });
      setImgs(prev => ({ ...prev, ...map }));
    })();
    return () => { cancelled = true; };
  }, [picks.map(p => p.id).join(",")]);

  const items = picks.map(p => imgs[p.id] ? { ...p, emoji: imgs[p.id] } : p);

  // Animate in once. Resets when picks identity changes (i.e., user-triggered reshuffle).
  const [shown, setShown] = useState(0);
  const picksKey = picks.map(p => p.id).join(",");
  useEffect(() => {
    setShown(0);
    if (items.length === 0) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setShown(s => {
        if (s >= items.length) return s;
        t = setTimeout(tick, 180);
        return s + 1;
      });
    };
    t = setTimeout(tick, 180);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picksKey]);

  if (items.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-10">
        Gear, outfits, brushes & power-ups — earned with chalk.
      </div>
    );
  }
  return (
    <div
      className="grid grid-cols-2 gap-3"
      onMouseEnter={() => setShuffleKey(k => k + 1)}
    >
      {items.map((it, i) => (
        <div
          key={it.id}
          className={cn(
            "transition-all duration-500",
            i < shown ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"
          )}
        >
          <ShopPreviewTile item={it} />
        </div>
      ))}
    </div>
  );
}

function mockItem(name: string, rarity: ShopItem["rarity"], emoji: string): ShopItem {
  return {
    id: "mock_" + name,
    name,
    group: "outfit",
    category: "outfit" as any,
    slot: "outfit",
    rarity,
    price: 100,
    emoji,
    desc: "+12% chalk on hard boulders.",
    bonus: { mult: 0.12, appliesTo: "all" },
  } as ShopItem;
}

function useStagger(count: number, delay = 180) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (count === 0) return;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      setShown(s => {
        if (s >= count) return s;
        t = setTimeout(tick, delay);
        return s + 1;
      });
    };
    t = setTimeout(tick, delay);
    return () => clearTimeout(t);
  }, [count, delay]);
  return shown;
}

function LogSlide() {
  const items = [
    { image: boulderImg, title: "Boulder", desc: "First try, or a few attempts in a session.", ring: "ring-[hsl(var(--btn-green))]/60" },
    { image: bossImg, title: "Boss Project", desc: "Hard. Multi-session grind. Your nemesis.", ring: "ring-[hsl(var(--btn-orange))]/60" },
  ];
  const shown = useStagger(items.length);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {items.map((it, i) => (
          <div
            key={it.title}
            className={cn(
              "transition-all duration-500",
              i < shown ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"
            )}
          >
            <PickCard image={it.image} title={it.title} desc={it.desc} ring={it.ring} />
          </div>
        ))}
      </div>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-[hsl(var(--btn-green))]/15 border border-[hsl(var(--btn-green))]/40">
          <ScrollText className="h-3.5 w-3.5" /> Log every session in seconds
        </div>
      </div>
    </div>
  );
}

function BossCard({
  image,
  name,
  attempts,
  pct,
  ring = "ring-[hsl(var(--boss))]/60",
  barColor = "hsl(var(--boss))",
}: {
  image: string;
  name: string;
  attempts: number;
  pct: number;
  ring?: string;
  barColor?: string;
}) {
  return (
    <div className="space-y-2">
      <PickCard
        image={image}
        title={name}
        desc={`${attempts} attempts · ${pct}% to send`}
        ring={ring}
      />
      <div className="px-1 flex items-center gap-2">
        <Swords className="h-3.5 w-3.5 shrink-0" style={{ color: barColor }} />
        <div className="flex-1"><PixelBar value={pct} max={100} color={barColor} /></div>
        <span className="text-[10px] tabular-nums text-muted-foreground">{pct}%</span>
      </div>
    </div>
  );
}

function BossSlide() {
  const [pct, setPct] = useState(15);
  useEffect(() => {
    let v = 15;
    const t = setInterval(() => {
      v = v >= 80 ? 15 : v + 5;
      setPct(v);
    }, 300);
    return () => clearInterval(t);
  }, []);
  const bosses = [
    { image: bossImg, name: "The Crux Cave", attempts: 12, pct, ring: "ring-[hsl(var(--btn-orange))]/60", barColor: "hsl(var(--boss))" },
    { image: crystalCaveImg, name: "Crystal Cavern", attempts: 7, pct: Math.max(10, pct - 25), ring: "ring-[hsl(280_70%_60%)]/60", barColor: "hsl(280 70% 60%)" },
  ];
  const shown = useStagger(bosses.length);
  return (
    <div className="grid grid-cols-2 gap-3">
      {bosses.map((b, i) => (
        <div
          key={b.name}
          className={cn(
            "transition-all duration-500",
            i < shown ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"
          )}
        >
          <BossCard {...b} />
        </div>
      ))}
    </div>
  );
}


function LevelUpSlide() {
  useLevelOverrides();
  const cur = resolvedLevel(6, "male");
  const nxt = resolvedLevel(7, "male");
  const nextDef = LEVELS.find(l => l.level === 7)!;
  const cards = [
    { key: "cur", node: (
      <LevelPreviewCard
        title={cur.title}
        desc={cur.desc}
        level={6}
        gender="male"
        equipped={{}}
        ringClass="ring-[hsl(var(--panel-frame))]/40"
        badgeLabel=""
        badgeClass=""
        unlocks={[]}
        unlocksLabel=""
      />
    )},
    { key: "nxt", node: (
      <LevelPreviewCard
        title={nxt.title}
        desc={nxt.desc}
        level={7}
        gender="male"
        equipped={{}}
        ringClass="ring-[hsl(var(--btn-orange))]/60"
        badgeLabel=""
        badgeClass=""
        unlocks={nextDef.unlocks}
        unlocksLabel="Unlocks"
        cost={nextDef.cost}
      />
    )},
  ];
  const shown = useStagger(cards.length);
  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c, i) => (
        <div
          key={c.key}
          className={cn(
            "transition-all duration-500",
            i < shown ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-2"
          )}
        >
          {c.node}
        </div>
      ))}
    </div>
  );
}

/* ---------------- Background ---------------- */

function BackgroundOrbs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[hsl(var(--btn-orange))]/20 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-[hsl(var(--btn-green))]/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[hsl(var(--accent))]/15 blur-3xl" />
    </div>
  );
}

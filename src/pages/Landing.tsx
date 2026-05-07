import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GameButton } from "@/components/ui/game-button";
import { GameCard, PixelBar } from "@/components/ui/game-card";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { PickCard } from "@/components/pixel/PickCard";
import { LevelPreviewCard } from "@/components/LevelPreviewCard";
import { ItemCard } from "@/components/ItemCard";
import { LEVELS, ShopItem } from "@/game/data";
import { useAllItems } from "@/game/customItems";
import { resolvedLevel, useLevelOverrides } from "@/game/levelOverrides";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { ArrowRight, ScrollText, Sparkles, ArrowUp, Trophy } from "lucide-react";
import logoImg from "@/assets/climbquest-logo.png";
import boulderImg from "@/assets/log-boulder.webp";
import bossImg from "@/assets/log-boss.webp";
import chalkBagImg from "@/assets/chalk-bag.png";

export default function Landing() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  if (!loading && user) return <Navigate to="/home" replace />;
  const goAuth = () => nav("/auth");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[hsl(var(--background))]" style={{ backgroundImage: "radial-gradient(ellipse at top, hsl(var(--background)) 0%, hsl(0 0% 4%) 100%)" }}>
      <BackgroundOrbs />

      {/* Top bar */}
      <header className="relative z-10">
        <div className="container flex items-center justify-between gap-4 py-5">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logoImg}
              alt="ClimbQuest"
              className="h-12 sm:h-14 w-auto transition-transform group-hover:rotate-[-4deg] drop-shadow-[0_2px_6px_hsl(0_0%_0%/0.55)]"
            />
          </Link>
          <div className="flex items-center gap-2">
            <GameButton variant="ghost" size="sm" onClick={goAuth}>Sign in</GameButton>
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
              Log boulders. Earn Chalk. Send bosses.
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Log climbs, earn <span className="gradient-chalk-text">chalk</span>, level up.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              ClimbQuest is a climbing tracker that plays like an RPG. Log climbs, earn chalk,
              kit out your character, and slowly defeat your hardest projects.
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
          <p className="text-muted-foreground mt-2">From the first slab to your hardest project.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <PickCard
            image={boulderImg}
            title="1. Log climbs"
            desc="Every boulder, attempt, and flash counted in seconds."
            ring="ring-[hsl(var(--btn-green))]/60"
          />
          <PickCard
            content={
              <img
                src={chalkBagImg}
                alt="Chalk bag"
                loading="lazy"
                className="h-[70%] w-[70%] object-contain drop-shadow-[0_8px_20px_hsl(42_100%_55%/0.4)]"
              />
            }
            title="2. Earn Chalk"
            desc="Style bonuses, equipped gear, and consumables stack into XP."
            ring="ring-[hsl(var(--btn-orange))]/60"
          />
          <PickCard
            content={
              <div className="scale-110">
                <ClimberAvatar level={10} gender="male" equipped={{} as any} size="xl" glow />
              </div>
            }
            title="3. Level up"
            desc="Unlock new avatars, items, badges, and gear slots."
            ring="ring-[hsl(var(--accent))]/60"
          />
        </div>
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

const SLIDE_LABELS = ["Characters", "Gear", "Log climbs", "Boss projects", "Level up"];

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
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
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
    return out.slice(0, 12);
  }, [overrides]);

  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (slots.length === 0) return;
    const t = setInterval(() => {
      setShown(s => {
        if (s >= slots.length) {
          clearInterval(t);
          return s;
        }
        return s + 1;
      });
    }, 180);
    return () => clearInterval(t);
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
  const items: ShopItem[] = useMemo(() => {
    const withImg = all.filter(i => !!i.emoji && (i.emoji.startsWith("http") || i.emoji.startsWith("data:") || i.emoji.startsWith("/")));
    if (withImg.length === 0) return [];
    const leg = withImg.filter(i => i.rarity === "legendary").slice(0, 1);
    const epic = withImg.filter(i => i.rarity === "epic").slice(0, 1);
    const rare = withImg.filter(i => i.rarity === "rare").slice(0, 2);
    const picked = [...leg, ...epic, ...rare];
    const rest = withImg.filter(i => !picked.includes(i));
    return [...picked, ...rest].slice(0, 4);
  }, [all]);

  if (items.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-10">
        Gear, outfits, brushes & power-ups — earned with chalk.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(it => <ItemCard key={it.id} item={it} />)}
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

function LogSlide() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <PickCard image={boulderImg} title="Boulder" desc="First try, or a few attempts in a session." ring="ring-[hsl(var(--btn-green))]/60" />
        <PickCard image={bossImg} title="Boss Project" desc="Hard. Multi-session grind. Your nemesis." ring="ring-[hsl(var(--boss))]/70" />
      </div>
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-[hsl(var(--btn-green))]/15 border border-[hsl(var(--btn-green))]/40">
          <ScrollText className="h-3.5 w-3.5" /> Log every session in seconds
        </div>
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
  return (
    <div
      className={cn(
        "rounded-xl text-left border-2 border-[hsl(var(--panel-frame))] bg-secondary/50 overflow-hidden ring-2 ring-[hsl(var(--boss))]/60",
        "shadow-[inset_0_2px_0_hsl(0_0%_100%/0.06),inset_0_-3px_0_hsl(0_0%_0%/0.4),0_8px_18px_-10px_hsl(0_0%_0%/0.6)]"
      )}
    >
      <div className="aspect-[16/9] w-full overflow-hidden bg-black/40">
        <img src={bossImg} alt="Boss" className="h-full w-full object-cover" />
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display font-bold text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-[hsl(var(--boss))]" /> The Crux Cave
            </div>
            <div className="text-xs text-muted-foreground">12 attempts · highest point: {pct}%</div>
          </div>
          <div className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[hsl(var(--boss))]/20 text-[hsl(var(--boss))] border border-[hsl(var(--boss))]/40">
            Project
          </div>
        </div>
        <PixelBar value={pct} max={100} color="hsl(var(--boss))" />
      </div>
    </div>
  );
}

function LevelUpSlide() {
  useLevelOverrides();
  const cur = resolvedLevel(6, "male");
  const nxt = resolvedLevel(7, "male");
  const nextDef = LEVELS.find(l => l.level === 7)!;
  return (
    <div className="grid grid-cols-2 gap-3">
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

import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, ScrollText, Store, Backpack, Settings, LogOut, Building2, Plus, ArrowUp, Trophy, Dumbbell } from "lucide-react";
import { useLoadCharacterName } from "@/game/characterName";
import { GameButton } from "@/components/ui/game-button";
import { useGame, nextLevel, levelUp, currentLevel, grantFreeItems, useRemoteHydrated, claimDailyLoginIfNeeded, DAILY_LOGIN_REWARD, onBadgesAwarded, BADGE_CHALK_REWARD, strengthRepChalk, activityLevelMult, type StrengthWorkout } from "@/game/store";
import { useLevelOverrides } from "@/game/levelOverrides";
import { useAllItems, useCatalogLoaded } from "@/game/customItems";
import { BASE_CHALK, ACTIVITY_LABELS, ActivityType, BADGE_BY_ID } from "@/game/data";
import { useDailyCapConfig, computeDailyCap, chalkUsedOnDate } from "@/game/dailyCap";
import { useStreakConfig, cycleDay, streakDayBonusPct } from "@/game/streak";
import { currentStreak } from "@/game/dailyCap";
import { cn } from "@/lib/utils";
import { ThemeButton } from "@/components/ThemeSwitcher";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LevelsModal } from "@/components/LevelsModal";
import { LogModal } from "@/components/LogModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useAuth } from "@/hooks/useAuth";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";
import { showBadgeUnlock } from "@/components/pixel/BadgeUnlockBanner";
import { toast } from "sonner";
import chalkBagImg from "@/assets/chalk-bag.png";
import logoImg from "@/assets/climbquest-logo.png";
import { LevelPreviewCard } from "@/components/LevelPreviewCard";
import { useAllGyms } from "@/game/allGyms";
import { FeedbackButton } from "@/components/FeedbackButton";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";

const NAV_BASE = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Backpack },
  { to: "/shop", label: "Shop", icon: Store },
  { to: "/log", label: "Logs", icon: ScrollText },
  { to: "/gym", label: "My Gym", mobileLabel: "Gym", icon: Building2 },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
];
const NAV_ADMIN = { to: "/admin", label: "Admin", icon: Settings };

export default function Layout() {
  const s = useGame();
  const { user, isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const NAV = isAdmin ? [...NAV_BASE, NAV_ADMIN] : NAV_BASE;
  const [isIosStandalone, setIsIosStandalone] = useState(false);
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [confirmLvOpen, setConfirmLvOpen] = useState(false);
  const [needGymOpen, setNeedGymOpen] = useState(false);
  const gymState = useAllGyms();
  const hydrated = useRemoteHydrated();
  const showOnboarding = !!user && hydrated && !s.onboardedAt;
  const [dailyLoginOpen, setDailyLoginOpen] = useState(false);
  const [dailyLoginReward, setDailyLoginReward] = useState(0);
  useLoadCharacterName(user?.id ?? null);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const nav = window.navigator as Navigator & { standalone?: boolean; platform?: string; maxTouchPoints?: number };
    const isIos = /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === "MacIntel" && (nav.maxTouchPoints ?? 0) > 1);

    const updateStandaloneState = () => {
      setIsIosStandalone(isIos && (standaloneQuery.matches || nav.standalone === true));
    };

    updateStandaloneState();
    standaloneQuery.addEventListener("change", updateStandaloneState);
    return () => standaloneQuery.removeEventListener("change", updateStandaloneState);
  }, []);

  useEffect(() => {
    if (!user || !hydrated || !s.onboardedAt) return;
    const granted = claimDailyLoginIfNeeded();
    if (granted > 0) {
      setDailyLoginReward(granted);
      setDailyLoginOpen(true);
    }
  }, [user, hydrated, s.onboardedAt]);

  function tryOpenLog() {
    setLogOpen(true);
  }

  useLevelOverrides();
  const allItems = useAllItems();
  const catalogLoaded = useCatalogLoaded();
  useEffect(() => {
    if (catalogLoaded) grantFreeItems(allItems);
  }, [catalogLoaded, allItems]);

  useEffect(() => {
    const h = () => setConfirmLvOpen(true);
    window.addEventListener("cq:open-level-up-confirm", h);
    return () => window.removeEventListener("cq:open-level-up-confirm", h);
  }, []);

  // Celebrate newly-awarded badges with a full-screen modal banner.
  useEffect(() => {
    return onBadgesAwarded(ids => {
      ids.forEach((id, i) => {
        const b = BADGE_BY_ID[id];
        const name = b?.name ?? "New Badge";
        const emoji = b?.emoji ?? "🏅";
        setTimeout(() => {
          showBadgeUnlock(name, emoji, BADGE_CHALK_REWARD);
        }, i * 200);
      });
    });
  }, []);

  // Streak milestones — the StreakMilestoneBanner listens to onStreakEvent directly,
  // so no extra wiring needed here.
  const cur = currentLevel(s);
  const nxt = nextLevel(s);
  const canLevel = !!nxt && s.chalk >= nxt.cost;

  const onConfirmLevelUp = () => {
    const target = nxt?.title ?? "";
    const fromLevel = s.level;
    const fromTitle = cur.title;
    const toLevel = nxt?.level;
    const r = levelUp();
    setConfirmLvOpen(false);
    if (r.ok) {
      showLevelUpBanner(target, r.unlocks ?? [], { fromLevel, toLevel, fromTitle, gender: s.gender });
      toast.success("Level up!");
    } else toast.error(r.reason ?? "Cannot level up");
  };

  return (
    <div className={cn("min-h-screen flex flex-col", isIosStandalone && "cq-ios-standalone")}> 
      <LevelsModal
        open={levelsOpen}
        onOpenChange={setLevelsOpen}
        currentLevel={s.level}
        gender={s.gender}
        canLevelUp={canLevel}
        nextCost={nxt?.cost}
        onLevelUpClick={() => { setLevelsOpen(false); setConfirmLvOpen(true); }}
      />
      <LogModal open={logOpen} onOpenChange={setLogOpen} />
      <OnboardingModal open={showOnboarding} onClose={() => { /* completion handled inside */ }} />
      <DailyLoginDialog open={dailyLoginOpen} onOpenChange={setDailyLoginOpen} reward={dailyLoginReward} />
      <Dialog open={needGymOpen} onOpenChange={setNeedGymOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set up your gym first</DialogTitle>
            <DialogDescription>
              Before logging boulders, you'll need to set up your gym so we know which grades and hold colors to use.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <GameButton variant="ghost" size="sm" onClick={() => setNeedGymOpen(false)}>Cancel</GameButton>
            <GameButton variant="primary" size="sm" onClick={() => { setNeedGymOpen(false); nav("/gym"); }}>
              <Building2 className="h-4 w-4" /> Go to My Gym
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmLvOpen} onOpenChange={setConfirmLvOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Level up?</DialogTitle>
            <DialogDescription>
              {nxt ? <>Spend <span className="font-bold gradient-chalk-text">{nxt.cost.toLocaleString()} Chalk</span> to advance.</> : "Already at max level."}
            </DialogDescription>
          </DialogHeader>
          {nxt && (
            <div className="grid sm:grid-cols-2 gap-3 mt-2">
              <LevelPreviewCard
                title={cur.title}
                desc={cur.desc}
                level={s.level}
                gender={s.gender}
                equipped={s.equipped}
                ringClass="ring-[hsl(var(--panel-frame))]/40"
                badgeLabel="Current"
                badgeClass="bg-secondary text-foreground/80"
                unlocks={cur.unlocks}
                unlocksLabel="You have"
              />
              <LevelPreviewCard
                title={nxt.title}
                desc={nxt.desc}
                level={nxt.level}
                gender={s.gender}
                equipped={s.equipped}
                ringClass="ring-[hsl(var(--btn-orange))]/60"
                badgeLabel="Next"
                badgeClass="bg-[hsl(var(--btn-orange))] text-white"
                unlocks={nxt.unlocks}
                unlocksLabel="Unlocks"
                cost={nxt.cost}
              />
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <GameButton variant="ghost" size="sm" onClick={() => setConfirmLvOpen(false)}>Cancel</GameButton>
            <GameButton variant="primary" size="sm" onClick={onConfirmLevelUp} disabled={!canLevel}>
              <ArrowUp className="h-4 w-4" /> Level Up{nxt ? ` (${nxt.cost.toLocaleString()})` : ""}
            </GameButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <header className="cq-header sticky top-0 z-40 backdrop-blur-xl border-b-2 border-[hsl(var(--panel-frame))] shadow-[0_2px_0_hsl(var(--panel-edge)/0.5),0_8px_24px_-12px_hsl(0_0%_0%/0.7)]" style={{ background: "hsl(var(--topbar-color, 210 25% 8%) / var(--topbar-opacity, 0.88))" }}>
        <div className="container flex items-center justify-between gap-4 py-5">
          <NavLink to="/home" className="flex items-center gap-4 group flex-1 min-w-0">
            <img
              src={logoImg}
              alt="ClimbQuest"
              className="h-auto w-full max-h-20 max-w-[180px] object-contain object-left transition-transform group-hover:rotate-[-4deg] drop-shadow-[0_2px_6px_hsl(0_0%_0%/0.55)]"
            />
            <div className="leading-tight hidden xl:block">
              <div className="text-sm text-muted-foreground">Log boulders. Earn Chalk. Send bosses.</div>
            </div>
          </NavLink>
          <div className="flex items-center gap-3">
            <GameButton variant="success" size="sm" onClick={tryOpenLog} className="hidden sm:inline-flex">
              <Plus className="h-4 w-4" /> Log
            </GameButton>
            <GameButton variant="success" size="sm" onClick={tryOpenLog} className="sm:hidden !px-2.5" aria-label="Log">
              <Plus className="h-4 w-4" />
            </GameButton>
            {isAdmin && <div className="hidden xl:contents"><ThemeButton /></div>}
            <NotificationCenter />
            <ChalkChip value={s.chalk} />
            <button type="button" onClick={() => setLevelsOpen(true)}
              className={cn(
                "relative flex items-center gap-1.5 px-3 h-9 rounded-full border-2 border-[hsl(var(--panel-frame))] text-sm shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)] hover:brightness-110 transition",
                canLevel
                  ? "bg-[hsl(var(--btn-orange))] text-white"
                  : "bg-secondary"
              )}
              title={canLevel ? "Ready to level up!" : undefined}
            >
              {canLevel && (
                <span aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
                  {Array.from({ length: 10 }).map((_, i) => {
                    const dx = (i % 2 === 0 ? -1 : 1) * (8 + (i * 7) % 22);
                    const delay = (i * 130) % 1300;
                    const size = 4 + (i % 3) * 2;
                    return (
                      <span
                        key={i}
                        className="absolute left-1/2 top-1/2 rounded-full bg-white animate-chalk-fly"
                        style={{
                          width: size,
                          height: size,
                          marginLeft: -size / 2,
                          marginTop: -size / 2,
                          filter: "blur(1px)",
                          ["--dx" as any]: `${dx}px`,
                          animationDelay: `${delay}ms`,
                        }}
                      />
                    );
                  })}
                </span>
              )}
              <span className={cn("relative text-[11px] uppercase tracking-wider", canLevel ? "text-white/90" : "text-muted-foreground")}>Lv</span>
              <span className={cn("relative font-bold tabular-nums", canLevel ? "text-white" : "text-[hsl(var(--sky))]")}>{s.level}</span>
              {canLevel && <ArrowUp className="relative h-3.5 w-3.5" />}
            </button>
            <GameButton variant="danger" size="sm" onClick={async () => { await signOut(); nav("/"); }} title="Sign out" aria-label="Sign out" className="!px-2.5">
              <LogOut className="h-4 w-4" />
            </GameButton>
          </div>
        </div>
        {/* Top nav (desktop) */}
        <nav className="hidden md:block">
          <div className="container flex gap-1.5 py-2">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "px-3.5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all border whitespace-nowrap",
                    isActive
                      ? "text-white border-[hsl(var(--panel-frame))] bg-[hsl(var(--btn-orange))] shadow-[inset_0_2px_0_hsl(0_0%_100%/0.32)]"
                      : "text-muted-foreground hover:text-foreground border-transparent hover:bg-secondary/50",
                  )
                }
              >
                <n.icon className="h-4 w-4 shrink-0" /> <span className="whitespace-nowrap">{n.label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="cq-main flex-1 container py-6 sm:py-8 pb-28 md:pb-10">
        <Outlet />
      </main>

      <FeedbackButton />

      {/* Bottom nav (mobile) */}
      <nav
        className="cq-bottom-nav md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border"
      >
        <div className="grid" style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}
              className={({ isActive }) =>
                cn("flex flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
                  isActive ? "text-foreground" : "text-muted-foreground")
              }>
              <n.icon className="h-5 w-5" />
              <span className="truncate">{(n as any).mobileLabel ?? n.label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function formatChalk(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 100_000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString();
}

function ChalkChip({ value }: { value: number }) {
  const [open, setOpen] = useState(false);
  const s = useGame();
  const dailyCapCfg = useDailyCapConfig();
  const dailyCap = computeDailyCap(s.level, dailyCapCfg);
  const usedToday = chalkUsedOnDate(s, new Date().toISOString());
  const showCap = dailyCapCfg.enabled && dailyCap > 0;
  const streakCfg = useStreakConfig();
  const levelMultPct = Math.round((activityLevelMult(s.level) - 1) * 100);

  // Activity rows sorted ascending by points — base shown is the level-scaled value the player actually earns.
  const activities = (Object.keys(BASE_CHALK) as ActivityType[])
    .filter(a => a !== "boulder_send" && a !== "project_boulder")
    .map(a => ({ label: ACTIVITY_LABELS[a], chalk: Math.round(BASE_CHALK[a] * activityLevelMult(s.level)) }))
    .sort((a, b) => a.chalk - b.chalk);

  // Strength: general per-rep tier explanation (independent of user's unlocked levels).
  const strengthTiers = [
    { name: "Max level", chalk: strengthRepChalk(10, 10, s.level) },
    { name: "Max level − 1", chalk: strengthRepChalk(9, 10, s.level) },
    { name: "Max level − 2", chalk: strengthRepChalk(8, 10, s.level) },
    { name: "Lower levels", chalk: strengthRepChalk(1, 10, s.level) },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View chalk earning guide"
        className="flex items-center gap-2.5 pl-3 pr-3 sm:pr-4 h-10 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary transition-transform hover:brightness-110 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        style={{
          boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -1px 0 hsl(0 0% 0% / 0.55)",
        }}
      >
        <img src={chalkBagImg} alt="" className="h-6 w-6 object-contain drop-shadow-[0_1px_0_hsl(0_0%_0%/0.5)]" />
        <span className="text-sm font-bold tabular-nums gradient-chalk-text">{formatChalk(value)}</span>
        <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-muted-foreground">Chalk</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={chalkBagImg} alt="" className="h-6 w-6 object-contain" />
              How you earn Chalk
            </DialogTitle>
            <DialogDescription>
              Base points per activity, plus equipped item bonuses.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
            {/* ---------- Column 1 ---------- */}
            <div className="space-y-4">
              <div>
                <div className="menu-label mb-2">Boulders (per send)</div>
                <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden">
                  {activities.map(a => (
                    <div key={a.label} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-foreground/90">{a.label}</span>
                      <span className="tabular-nums font-bold gradient-chalk-text">+{a.chalk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="menu-label mb-2">Strength (per rep)</div>
                <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden">
                  {strengthTiers.map(r => (
                    <div key={r.name} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-foreground/90">{r.name}</span>
                      <span className="tabular-nums font-bold gradient-chalk-text">+{r.chalk}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Per-rep chalk is highest at your max-unlocked level and tapers off below it. Beat the strength boss to raise the bar.
                </p>
              </div>

              <div>
                <div className="menu-label mb-2">Hold-type strength (per attempt)</div>
                <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden text-sm">
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-foreground/90">New personal record</span>
                    <span className="tabular-nums font-bold gradient-chalk-text">+200</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-foreground/90">First hold ever (per level)</span>
                    <span className="tabular-nums font-bold gradient-chalk-text">+100</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-foreground/90">≥ 50% of your record</span>
                    <span className="tabular-nums font-bold gradient-chalk-text">+50</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-foreground/90">≥ 10% of your record</span>
                    <span className="tabular-nums font-bold gradient-chalk-text">+10</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2">
                    <span className="text-foreground/90">Boss send (30s unbroken)</span>
                    <span className="tabular-nums font-bold gradient-chalk-text">+300</span>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Records are tracked separately per level. Holds under 10% of your record earn no chalk.
                </p>
              </div>
            </div>


            {/* ---------- Column 2 ---------- */}
            <div className="space-y-4">
              <div>
                <div className="menu-label mb-2">Daily limit</div>
                <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-foreground/90">
                      {showCap ? "Today's cap" : "No daily cap"}
                    </span>
                    <span className="tabular-nums font-bold gradient-chalk-text">
                      {showCap ? `${dailyCap.toLocaleString()} chalk` : "Unlimited"}
                    </span>
                  </div>
                  {showCap && (
                    <div className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="text-foreground/90">Earned today</span>
                      <span className="tabular-nums font-bold gradient-chalk-text">
                        {usedToday.toLocaleString()} / {dailyCap.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  {showCap
                    ? "Soft cap — past the cap, chalk earns at reduced rates."
                    : "Earn as much chalk as you want — no diminishing returns today."}
                </p>
              </div>

              {/* ---- Daily streak bonus ---- */}
              {streakCfg.enabled && (
                <div>
                  <div className="menu-label mb-2">🔥 Daily streak bonus</div>
                  <div className="rounded-lg border border-border overflow-hidden text-sm">
                    <div className="px-3 py-2 border-b border-border/60 text-xs text-muted-foreground">
                      Log any activity each day to keep the streak alive. Miss a day and it resets to 0.
                    </div>
                    <div className="grid grid-cols-7 text-center text-[11px]">
                      {streakCfg.dayBonusPcts.map((pct, i) => {
                        const day = i + 1;
                        const isToday = cycleDay(s.activeBuffs ? 0 : 0) === day; // visual reference only
                        return (
                          <div
                            key={i}
                            className={cn(
                              "py-2 border-r border-border/60 last:border-r-0",
                              day === 7 && "bg-[hsl(var(--btn-orange))]/15 font-bold",
                            )}
                          >
                            <div className="text-muted-foreground">D{day}</div>
                            <div className={cn("tabular-nums font-bold", day === 7 ? "text-[hsl(var(--btn-orange))]" : "gradient-chalk-text")}>+{pct}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Day 7 caps the cycle and grants <span className="text-chalk-glow font-semibold">+{streakCfg.post7ChalkPct}% chalk for {streakCfg.post7ChalkDays}d</span> and <span className="text-chalk-glow font-semibold">+{streakCfg.post7CritPct}% crit for {streakCfg.post7CritDays}d</span>. The cycle then restarts; the streak counter keeps climbing.
                  </p>
                </div>
              )}

              {/* ---- Streak milestones ---- */}
              {streakCfg.enabled && streakCfg.milestones.length > 0 && (
                <div>
                  <div className="menu-label mb-2">🏆 Streak milestones</div>
                  <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden text-sm">
                    {streakCfg.milestones.map(m => (
                      <div key={m.day} className="px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">Day {m.day} · {m.label}</div>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {m.buffs.map((b, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full border border-chalk-glow/40 bg-chalk-glow/10 text-chalk-glow">
                              +{b.pct}% {b.kind} · {b.days}d
                            </span>
                          ))}
                          {m.chalkCacheMult && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[hsl(var(--btn-orange))]/40 bg-[hsl(var(--btn-orange))]/10 text-[hsl(var(--btn-orange))]">
                              Chalk cache · {m.chalkCacheMult}× daily cap
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ---- Level scaling note ---- */}
              <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-xs">
                <div className="font-semibold mb-0.5">📈 Level scaling</div>
                <p className="text-muted-foreground">
                  Every activity earns +15% more chalk per climber level. You're at Lv {s.level} → all base rewards ×{(activityLevelMult(s.level)).toFixed(2)} ({levelMultPct >= 0 ? "+" : ""}{levelMultPct}%).
                </p>
              </div>


              <div>
                <div className="menu-label mb-2">Bonuses from equipped gear</div>
                <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden text-sm">
                  <div className="px-3 py-2">
                    <div className="font-semibold text-[hsl(var(--epic))]">💥 Crit</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Each item with a crit chance rolls when you log. On a hit, the run's chalk is doubled (×2).
                      Multiple crit items combine — odds stack so more gear means a bigger chance, capped at 100%.
                    </p>
                  </div>
                  <div className="px-3 py-2">
                    <div className="font-semibold text-legendary">👹 Boss bonus</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Only applies to boss attempts and sends. Boss-bonus % from every equipped item is added together,
                      then granted as extra chalk on top of the base reward.
                    </p>
                  </div>
                  <div className="px-3 py-2">
                    <div className="font-semibold text-[hsl(var(--boss))]">💀 Boss project penalty</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      You can keep up to 5 active boss projects, each with 60 days to defeat.
                      If a boss times out — or you admit defeat — you lose <strong>100 chalk</strong> per boss.
                    </p>
                  </div>
                  <div className="px-3 py-2">
                    <div className="font-semibold text-[hsl(var(--btn-orange))]">🛍️ Shop discount</div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Lowers prices in the Shop. Discounts don't stack — only your strongest equipped discount item is
                      applied to each item's price.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Equipped gear, auras, and consumables apply additional % bonuses on top of the base — including strength sessions.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DailyLoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const s = useGame();
  const streakCfg = useStreakConfig();
  const streak = currentStreak(s);
  // Today's streak day in the cycle. After claiming today, streak >= 1.
  const day = cycleDay(Math.max(1, streak));
  const todayPct = streakDayBonusPct(Math.max(1, streak), streakCfg);
  const nextMilestone = streakCfg.enabled
    ? streakCfg.milestones.filter(m => m.day > streak).sort((a, b) => a.day - b.day)[0]
    : undefined;
  const daysToMilestone = nextMilestone ? nextMilestone.day - streak : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={chalkBagImg} alt="" className="h-7 w-7 object-contain" />
            Welcome back, climber!
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 pt-1">
              <div>
                You earned <span className="inline-flex items-center gap-1 font-bold gradient-chalk-text"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />+{DAILY_LOGIN_REWARD} Chalk</span> just for showing up today.
              </div>

              {streakCfg.enabled && (
                <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/90">🔥 Current streak</span>
                    <span className="font-bold tabular-nums">{streak} day{streak === 1 ? "" : "s"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/90">Today's chalk bonus (Day {day}/7)</span>
                    <span className="font-bold tabular-nums gradient-chalk-text">+{todayPct}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Log any activity today to keep your streak — Day 7 caps the cycle with a big bonus and unlocks multi-day buffs.
                  </p>
                  {nextMilestone && (
                    <p className="text-[11px] text-[hsl(var(--btn-orange))]">
                      🏆 {daysToMilestone} day{daysToMilestone === 1 ? "" : "s"} to <strong>{nextMilestone.label}</strong> (Day {nextMilestone.day}).
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <GameButton variant="primary" size="sm" onClick={() => onOpenChange(false)}>
            Start Climbing
          </GameButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

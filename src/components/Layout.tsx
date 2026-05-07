import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, ScrollText, Store, Backpack, Settings, LogOut, Building2, Plus, ArrowUp, FlaskConical, User as UserIcon } from "lucide-react";
import { switchToSlot, useActiveSlot } from "@/game/adminAccounts";
import { GameButton } from "@/components/ui/game-button";
import { useGame, nextLevel, levelUp, currentLevel } from "@/game/store";
import { useLevelOverrides } from "@/game/levelOverrides";
import { BASE_CHALK, ACTIVITY_LABELS, ActivityType } from "@/game/data";
import { cn } from "@/lib/utils";
import { ThemeButton } from "@/components/ThemeSwitcher";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { LevelsModal } from "@/components/LevelsModal";
import { LogModal } from "@/components/LogModal";
import { ClimberAvatar } from "@/components/ClimberAvatar";
import { useAuth } from "@/hooks/useAuth";
import { showLevelUpBanner } from "@/components/pixel/LevelUpBanner";
import { toast } from "sonner";
import chalkBagImg from "@/assets/chalk-bag.png";
import logoImg from "@/assets/climbquest-logo.png";
import { LevelPreviewCard } from "@/components/LevelPreviewCard";

const NAV_BASE = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Backpack },
  { to: "/shop", label: "Shop", icon: Store },
  { to: "/log", label: "Boulder Logs", icon: ScrollText },
  
  { to: "/gym", label: "My Gym", icon: Building2 },
];
const NAV_ADMIN = { to: "/admin", label: "Admin", icon: Settings };

export default function Layout() {
  const s = useGame();
  const { user, isAdmin, signOut } = useAuth();
  const activeSlot = useActiveSlot(user?.id ?? null);
  const nav = useNavigate();
  const NAV = isAdmin ? [...NAV_BASE, NAV_ADMIN] : NAV_BASE;
  const [levelsOpen, setLevelsOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [confirmLvOpen, setConfirmLvOpen] = useState(false);

  useLevelOverrides();

  useEffect(() => {
    const h = () => setConfirmLvOpen(true);
    window.addEventListener("cq:open-level-up-confirm", h);
    return () => window.removeEventListener("cq:open-level-up-confirm", h);
  }, []);
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
    <div className="min-h-screen flex flex-col">
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
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b-2 border-[hsl(var(--panel-frame))] shadow-[0_2px_0_hsl(var(--panel-edge)/0.5),0_8px_24px_-12px_hsl(0_0%_0%/0.7)]" style={{ background: "hsl(var(--topbar-color, 210 25% 8%) / var(--topbar-opacity, 0.88))" }}>
        <div className="container flex items-center justify-between gap-4 py-5">
          <NavLink to="/home" className="flex items-center gap-4 group">
            <img
              src={logoImg}
              alt="ClimbQuest"
              className="h-16 sm:h-20 w-auto transition-transform group-hover:rotate-[-4deg] drop-shadow-[0_2px_6px_hsl(0_0%_0%/0.55)]"
            />
            <div className="leading-tight hidden sm:block">
              <div className="text-sm text-muted-foreground">Log boulders. Earn Chalk. Send bosses.</div>
            </div>
          </NavLink>
          <div className="flex items-center gap-3">
            <GameButton variant="success" size="sm" onClick={() => setLogOpen(true)} className="hidden sm:inline-flex">
              <Plus className="h-4 w-4" /> Log Boulder
            </GameButton>
            <GameButton variant="success" size="sm" onClick={() => setLogOpen(true)} className="sm:hidden !px-2.5" aria-label="Log Boulder">
              <Plus className="h-4 w-4" />
            </GameButton>
            {isAdmin && <ThemeButton />}
            {isAdmin && user && (
              <button
                type="button"
                onClick={() => {
                  const next = activeSlot === "test" ? "personal" : "test";
                  switchToSlot(user.id, next);
                  toast.success(`Switched to ${next} account`);
                }}
                title={`Active: ${activeSlot} account — click to switch`}
                className={cn(
                  "hidden sm:inline-flex items-center gap-1.5 px-2.5 h-9 rounded-full border-2 border-[hsl(var(--panel-frame))] text-xs font-semibold uppercase tracking-wider transition hover:brightness-110",
                  activeSlot === "test"
                    ? "bg-[hsl(var(--btn-orange))] text-white"
                    : "bg-secondary text-foreground/90"
                )}
              >
                {activeSlot === "test" ? <FlaskConical className="h-3.5 w-3.5" /> : <UserIcon className="h-3.5 w-3.5" />}
                {activeSlot === "test" ? "Test" : "Personal"}
              </button>
            )}
            <ChalkChip value={s.chalk} />
            <button type="button" onClick={() => setLevelsOpen(true)}
              className={cn(
                "relative hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full border-2 border-[hsl(var(--panel-frame))] text-sm shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)] hover:brightness-110 transition",
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

      <main className="flex-1 container py-6 sm:py-8 pb-28 md:pb-10">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/90 backdrop-blur-xl border-t border-border">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${NAV.length}, minmax(0, 1fr))` }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}
              className={({ isActive }) =>
                cn("flex flex-col items-center justify-center gap-0.5 py-2 text-[10px]",
                  isActive ? "text-foreground" : "text-muted-foreground")
              }>
              <n.icon className="h-5 w-5" />
              <span className="truncate">{n.label.split(" ")[0]}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ChalkChip({ value }: { value: number }) {
  const [open, setOpen] = useState(false);

  // Activity rows sorted ascending by points
  const activities = (Object.keys(BASE_CHALK) as ActivityType[])
    .filter(a => a !== "boulder_send")
    .map(a => ({ label: ACTIVITY_LABELS[a], chalk: BASE_CHALK[a] }))
    .sort((a, b) => a.chalk - b.chalk);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View chalk earning guide"
        className="flex items-center gap-2.5 pl-3 pr-4 h-10 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary transition-transform hover:brightness-110 active:translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70"
        style={{
          boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -1px 0 hsl(0 0% 0% / 0.55)",
        }}
      >
        <img src={chalkBagImg} alt="" className="h-6 w-6 object-contain drop-shadow-[0_1px_0_hsl(0_0%_0%/0.5)]" />
        <span className="text-sm font-bold tabular-nums gradient-chalk-text">{value.toLocaleString()}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Chalk</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <img src={chalkBagImg} alt="" className="h-6 w-6 object-contain" />
              How you earn Chalk
            </DialogTitle>
            <DialogDescription>
              Base points per activity, plus equipped item bonuses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <div className="menu-label mb-2">Per activity (base)</div>
              <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden">
                {activities.map(a => (
                  <div key={a.label} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-foreground/90">{a.label}</span>
                    <span className="tabular-nums font-bold gradient-chalk-text">+{a.chalk}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Equipped gear, auras, and consumables apply additional % bonuses on top of the base.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

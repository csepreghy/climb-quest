import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Home, ScrollText, Swords, User, Store, Backpack, Settings, LogOut, Building2 } from "lucide-react";
import { GameButton } from "@/components/ui/game-button";
import { useGame } from "@/game/store";
import { BASE_CHALK, ACTIVITY_LABELS, ActivityType } from "@/game/data";
import { cn } from "@/lib/utils";
import { ThemeButton } from "@/components/ThemeSwitcher";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LevelsModal } from "@/components/LevelsModal";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import chalkBagImg from "@/assets/chalk-bag.png";
import logoImg from "@/assets/climbquest-logo.png";

const NAV_BASE = [
  { to: "/", label: "Home", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Backpack },
  { to: "/log", label: "Log Boulder", icon: ScrollText },
  { to: "/bosses", label: "Boss Projects", icon: Swords },
  { to: "/character", label: "Character", icon: User },
  { to: "/gym", label: "My Gym", icon: Building2 },
  { to: "/shop", label: "Shop", icon: Store },
];
const NAV_ADMIN = { to: "/admin", label: "Admin", icon: Settings };

export default function Layout() {
  const s = useGame();
  const { isAdmin, signOut } = useAuth();
  const nav = useNavigate();
  const NAV = isAdmin ? [...NAV_BASE, NAV_ADMIN] : NAV_BASE;
  const [levelsOpen, setLevelsOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      <LevelsModal open={levelsOpen} onOpenChange={setLevelsOpen} currentLevel={s.level} />
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b-2 border-[hsl(var(--panel-frame))] shadow-[0_2px_0_hsl(var(--panel-edge)/0.5),0_8px_24px_-12px_hsl(0_0%_0%/0.7)]" style={{ background: "hsl(var(--topbar-color, 210 25% 8%) / var(--topbar-opacity, 0.88))" }}>
        <div className="container flex items-center justify-between gap-4 py-5">
          <NavLink to="/" className="flex items-center gap-4 group">
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
            <ThemeButton />
            <ChalkChip value={s.chalk} />
            <button type="button" onClick={() => setLevelsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary text-sm shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)] hover:brightness-110">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Lv</span>
              <span className="font-bold tabular-nums text-[hsl(var(--sky))]">{s.level}</span>
            </button>
            <GameButton variant="danger" size="icon" onClick={async () => { await signOut(); nav("/auth"); }} title="Sign out" aria-label="Sign out">
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


import { NavLink, Outlet } from "react-router-dom";
import { Home, ScrollText, Swords, User, Store, Backpack, Settings } from "lucide-react";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";
import { ThemeButton } from "@/components/ThemeSwitcher";
import chalkBagImg from "@/assets/chalk-bag.png";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/log", label: "Log Boulder", icon: ScrollText },
  { to: "/bosses", label: "Boss Projects", icon: Swords },
  { to: "/character", label: "Character", icon: User },
  { to: "/shop", label: "Shop", icon: Store },
  { to: "/inventory", label: "Inventory", icon: Backpack },
  { to: "/admin", label: "Admin", icon: Settings },
];

export default function Layout() {
  const s = useGame();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b-2 border-[hsl(var(--panel-frame))] shadow-[0_2px_0_hsl(var(--panel-edge)/0.5),0_8px_24px_-12px_hsl(0_0%_0%/0.7)]" style={{ background: "hsl(var(--topbar-color, 210 25% 8%) / var(--topbar-opacity, 0.88))" }}>
        <div className="container flex items-center justify-between gap-4 py-3">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-lg grid place-items-center transition-transform group-hover:rotate-[-4deg] bg-accent"
              style={{
                boxShadow: "0 0 0 2px hsl(var(--panel-frame)), inset 0 1px 0 hsl(0 0% 100% / 0.35), inset 0 -2px 0 hsl(16 70% 32% / 0.55), 0 2px 0 hsl(16 70% 32%)",
              }}>
              <span className="text-lg">🧗</span>
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold tracking-tight text-base">ClimbQuest</div>
              <div className="text-[11px] text-muted-foreground hidden sm:block">Log boulders. Earn Chalk. Send bosses.</div>
            </div>
          </NavLink>
          <div className="flex items-center gap-3">
            <ThemeButton />
            <ChalkChip value={s.chalk} />
            <div className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary text-sm shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)]">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Lv</span>
              <span className="font-bold tabular-nums text-[hsl(var(--sky))]">{s.level}</span>
            </div>
          </div>
        </div>
        {/* Top nav (desktop) */}
        <nav className="hidden md:block border-t border-[hsl(var(--panel-frame))]/70">
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
                      ? "text-white border-[hsl(var(--panel-frame))] bg-[hsl(var(--btn-orange))] shadow-[inset_0_2px_0_hsl(0_0%_100%/0.32),inset_0_-3px_0_hsl(var(--btn-orange-shadow)),0_3px_0_hsl(var(--btn-orange-shadow))]"
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
        <div className="grid grid-cols-6">
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
  return (
    <div
      className="flex items-center gap-2.5 pl-3 pr-4 h-10 rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary"
      style={{
        boxShadow: "inset 0 1px 0 hsl(0 0% 100% / 0.06), inset 0 -1px 0 hsl(0 0% 0% / 0.55)",
      }}
    >
      <img src={chalkBagImg} alt="" className="h-6 w-6 object-contain drop-shadow-[0_1px_0_hsl(0_0%_0%/0.5)]" />
      <span className="text-sm font-bold tabular-nums gradient-chalk-text">{value.toLocaleString()}</span>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Chalk</span>
    </div>
  );
}

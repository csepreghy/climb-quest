import { NavLink, Outlet } from "react-router-dom";
import { Home, ScrollText, Swords, User, Store, Backpack } from "lucide-react";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/log", label: "Log Boulder", icon: ScrollText },
  { to: "/bosses", label: "Boss Projects", icon: Swords },
  { to: "/character", label: "Character", icon: User },
  { to: "/shop", label: "Shop", icon: Store },
  { to: "/inventory", label: "Inventory", icon: Backpack },
];

export default function Layout() {
  const s = useGame();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b-[3px] border-border">
        <div className="container flex items-center justify-between gap-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="h-10 w-10 rounded-md bg-accent border-[3px] border-foreground/20 grid place-items-center shadow-[3px_3px_0_0_hsl(240_10%_2%)] group-hover:rotate-[-4deg] transition-transform">
              <span className="text-lg">🧗</span>
            </div>
            <div className="leading-tight">
              <div className="font-pixel tracking-tight text-sm sm:text-base text-shadow-pixel">ClimbQuest</div>
              <div className="text-[10px] text-muted-foreground hidden sm:block">Log boulders. Earn Chalk. Send bosses.</div>
            </div>
          </NavLink>
          <div className="flex items-center gap-2 sm:gap-3">
            <ChalkChip value={s.chalk} />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border-[3px] border-border bg-card font-pixel text-xs shadow-[3px_3px_0_0_hsl(240_10%_2%)]">
              <span className="text-muted-foreground">LV</span>
              <span>{s.level}</span>
            </div>
          </div>
        </div>
        {/* Top nav (desktop) */}
        <nav className="hidden md:block border-t border-border/60">
          <div className="container flex gap-1 py-1">
            {NAV.map(n => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn("px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")
                }
              >
                <n.icon className="h-4 w-4" /> {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1 container py-5 sm:py-8 pb-28 md:pb-10">
        <Outlet />
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-t border-border">
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
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-chalk/20 to-chalk-glow/25 border-[3px] border-chalk-glow/60 shadow-[3px_3px_0_0_hsl(240_10%_2%)]">
      <svg width="18" height="18" viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="1" y="0" width="6" height="1" fill="#3a2a1a" />
        <rect x="0" y="1" width="8" height="6" fill="#f5efe0" />
        <rect x="0" y="7" width="8" height="1" fill="#3a2a1a" />
        <rect x="2" y="3" width="2" height="1" fill="#cfc8b0" />
        <rect x="4" y="4" width="2" height="1" fill="#cfc8b0" />
      </svg>
      <span className="font-pixel text-xs gradient-chalk-text tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

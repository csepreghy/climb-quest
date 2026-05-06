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
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/75 border-b border-border">
        <div className="container flex items-center justify-between gap-4 py-3">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-md bg-secondary border border-border grid place-items-center group-hover:border-accent/60 transition-colors">
              <span className="text-base">🧗</span>
            </div>
            <div className="leading-tight">
              <div className="font-display font-semibold tracking-tight text-base">ClimbQuest</div>
              <div className="text-[11px] text-muted-foreground hidden sm:block">Log boulders. Earn Chalk. Send bosses.</div>
            </div>
          </NavLink>
          <div className="flex items-center gap-2">
            <ChalkChip value={s.chalk} />
            <div className="hidden sm:flex items-center gap-1.5 px-3 h-9 rounded-md border border-border bg-secondary/60 text-sm">
              <span className="text-muted-foreground text-xs">Lv</span>
              <span className="font-medium tabular-nums">{s.level}</span>
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
                  cn("px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors",
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50")
                }
              >
                <n.icon className="h-4 w-4" /> {n.label}
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
    <div className="flex items-center gap-1.5 px-3 h-9 rounded-md bg-secondary/60 border border-border">
      <span className="h-2 w-2 rounded-full bg-chalk-glow shadow-[0_0_8px_hsl(var(--chalk-glow))]" />
      <span className="text-sm font-medium tabular-nums">{value.toLocaleString()}</span>
      <span className="text-xs text-muted-foreground">Chalk</span>
    </div>
  );
}

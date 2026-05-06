import { Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

export function ThemeButton() {
  return (
    <NavLink
      to="/admin"
      aria-label="Theme studio"
      className="h-9 w-9 grid place-items-center rounded-full border-2 border-[hsl(var(--panel-frame))] bg-secondary text-foreground hover:brightness-110 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.08),inset_0_-1px_0_hsl(0_0%_0%/0.5)]"
    >
      <Settings className="h-4 w-4" />
    </NavLink>
  );
}

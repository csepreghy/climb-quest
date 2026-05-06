import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "legendary" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Flat solid fill + bevel-only shadow stack. */
const bevel = (fill: string, shadow: string, frame = "230 40% 4%") => ({
  background: `hsl(${fill})`,
  boxShadow: [
    `0 0 0 1px hsl(${frame})`,
    `inset 0 1px 0 hsl(0 0% 100% / 0.35)`,
    `inset 0 -2px 0 hsl(${shadow} / 0.55)`,
    `0 3px 0 0 hsl(${shadow})`,
    `0 6px 12px -4px hsl(0 0% 0% / 0.55)`,
  ].join(", "),
});

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   bevel("var(--btn-mint)",     "var(--btn-mint-shadow)"),
  success:   bevel("var(--btn-mint)",     "var(--btn-mint-shadow)"),
  secondary: bevel("var(--btn-slate)",    "var(--btn-slate-shadow)"),
  danger:    bevel("var(--btn-rose)",     "var(--btn-rose-shadow)"),
  legendary: bevel("var(--btn-lemon)",    "var(--btn-lemon-shadow)"),
  ghost:     {} as React.CSSProperties,
};

const variantText: Record<Variant, string> = {
  primary:   "text-[hsl(160_45%_12%)]",
  success:   "text-[hsl(160_45%_12%)]",
  secondary: "text-foreground",
  danger:    "text-[hsl(350_50%_14%)]",
  legendary: "text-[hsl(38_55%_14%)]",
  ghost:     "text-muted-foreground hover:text-foreground",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

export const GameButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", className, children, style, ...rest }, ref) => {
    const isGhost = variant === "ghost";
    return (
      <button
        ref={ref}
        {...rest}
        style={{ ...(isGhost ? {} : variantStyles[variant]), ...style }}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-semibold rounded-full",
          "select-none whitespace-nowrap tracking-wide",
          "transition-[transform,filter] duration-100 will-change-transform",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "hover:brightness-[1.06] active:brightness-95",
          !isGhost && "active:translate-y-[2px] active:[box-shadow:0_0_0_1px_hsl(0_0%_0%/0.6),inset_0_1px_0_hsl(0_0%_100%/0.18),inset_0_-1px_0_hsl(0_0%_0%/0.3),0_1px_0_0_hsl(0_0%_0%/0.5),0_3px_8px_-4px_hsl(0_0%_0%/0.5)]",
          isGhost && "rounded-md hover:bg-secondary/60",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
          variantText[variant],
          sizes[size],
          className,
        )}
      >
        <span className="relative drop-shadow-[0_1px_0_hsl(0_0%_100%/0.25)]">{children}</span>
      </button>
    );
  },
);
GameButton.displayName = "GameButton";

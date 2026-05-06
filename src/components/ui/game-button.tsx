import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "legendary" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Flat fill + chunky bevel: thick dark outline, top highlight, bottom inner shade, hard drop shadow. */
const bevel = (fill: string, shadow: string, frame = "var(--panel-frame)") => ({
  background: fill.startsWith("linear-gradient") || fill.startsWith("var(--gradient") ? fill : `hsl(${fill})`,
  boxShadow: [
    `0 0 0 2px hsl(${frame})`,
    `inset 0 2px 0 hsl(0 0% 100% / 0.32)`,
    `inset 0 -3px 0 hsl(${shadow})`,
    `0 4px 0 0 hsl(${shadow})`,
    `0 5px 0 0 hsl(${frame})`,
    `0 10px 16px -6px hsl(0 0% 0% / 0.6)`,
  ].join(", "),
});

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   bevel("var(--btn-orange)", "var(--btn-orange-shadow)"),
  success:   bevel("var(--btn-green)",  "var(--btn-green-shadow)"),
  secondary: bevel("var(--btn-stone)",  "var(--btn-stone-shadow)"),
  danger:    bevel("var(--btn-red)",    "var(--btn-red-shadow)"),
  legendary: bevel("var(--btn-gold)",   "var(--btn-gold-shadow)"),
  ghost:     {} as React.CSSProperties,
};

const variantText: Record<Variant, string> = {
  primary:   "text-white",
  success:   "text-white",
  secondary: "text-foreground",
  danger:    "text-white",
  legendary: "text-[hsl(28_60%_16%)]",
  ghost:     "text-muted-foreground hover:text-foreground",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
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
          "relative inline-flex items-center justify-center gap-2 font-bold rounded-xl",
          "select-none whitespace-nowrap tracking-wide uppercase text-[0.78em]",
          "transition-[transform,filter] duration-100 will-change-transform",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "hover:brightness-[1.06] active:brightness-95",
          !isGhost && "active:translate-y-[3px] active:[box-shadow:0_0_0_2px_hsl(var(--panel-frame)),inset_0_1px_0_hsl(0_0%_100%/0.18),inset_0_-1px_0_hsl(0_0%_0%/0.3),0_1px_0_0_hsl(var(--panel-frame)),0_4px_8px_-4px_hsl(0_0%_0%/0.5)]",
          isGhost && "rounded-md hover:bg-secondary/60 normal-case",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
          variantText[variant],
          sizes[size],
          className,
        )}
      >
        <span className="relative drop-shadow-[0_2px_0_hsl(0_0%_0%/0.4)]">{children}</span>
      </button>
    );
  },
);
GameButton.displayName = "GameButton";

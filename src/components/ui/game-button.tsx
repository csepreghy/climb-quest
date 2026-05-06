import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "legendary" | "ghost" | "success";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** Shared bevel: light gradient top, dark gradient bottom, dark frame, hard bottom shadow. */
const bevel = (top: string, bot: string, frame: string, shadow: string) => ({
  background: `linear-gradient(180deg, hsl(${top}), hsl(${bot}))`,
  boxShadow: [
    `0 0 0 1px hsl(${frame})`,                          // outer dark frame
    `inset 0 1px 0 hsl(0 0% 100% / 0.30)`,              // top highlight
    `inset 0 -2px 0 hsl(0 0% 0% / 0.30)`,               // inner bottom shade
    `0 3px 0 0 hsl(${shadow})`,                         // hard drop (chunky)
    `0 6px 12px -4px hsl(0 0% 0% / 0.55)`,              // soft ground shadow
  ].join(", "),
});

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary:   bevel("var(--btn-orange-top)", "var(--btn-orange-bot)", "18 60% 14%", "18 75% 16%"),
  success:   bevel("var(--btn-green-top)",  "var(--btn-green-bot)",  "140 60% 10%", "140 70% 12%"),
  secondary: bevel("var(--btn-stone-top)",  "var(--btn-stone-bot)",  "28 30% 10%",  "28 30% 10%"),
  danger:    bevel("var(--btn-red-top)",    "var(--btn-red-bot)",    "354 60% 14%", "354 70% 16%"),
  legendary: bevel("var(--btn-gold-top)",   "var(--btn-gold-bot)",   "32 60% 14%",  "32 70% 18%"),
  ghost:     {} as React.CSSProperties,
};

const variantText: Record<Variant, string> = {
  primary:   "text-[hsl(24_40%_10%)]",
  success:   "text-[hsl(140_40%_8%)]",
  secondary: "text-foreground",
  danger:    "text-[hsl(0_30%_12%)]",
  legendary: "text-[hsl(28_50%_14%)]",
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
          // Press: collapse the chunky bottom shadow
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

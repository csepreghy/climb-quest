import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "legendary" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:   "bg-accent text-accent-foreground border-accent-foreground/30 [--gb-shadow:hsl(280_80%_18%)]",
  secondary: "bg-secondary text-foreground border-border [--gb-shadow:hsl(240_10%_2%)]",
  danger:    "bg-boss text-foreground border-foreground/30 [--gb-shadow:hsl(350_60%_18%)]",
  legendary: "bg-gradient-to-r from-legendary to-accent text-primary-foreground border-foreground/30 [--gb-shadow:hsl(35_60%_18%)]",
  ghost:     "bg-transparent text-foreground border-border [--gb-shadow:hsl(240_10%_2%)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-6 text-base",
};

export const GameButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-pixel uppercase tracking-wider",
          "border-[3px] rounded-md select-none whitespace-nowrap",
          "shadow-[0_5px_0_0_var(--gb-shadow),0_0_0_3px_hsl(0_0%_0%/0.3)]",
          "translate-y-0 transition-[transform,box-shadow] duration-100",
          "hover:brightness-110",
          "active:translate-y-[5px] active:shadow-[0_0_0_0_var(--gb-shadow),0_0_0_3px_hsl(0_0%_0%/0.3)]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
          variants[variant],
          sizes[size],
          className,
        )}
      >
        {children}
      </button>
    );
  },
);
GameButton.displayName = "GameButton";

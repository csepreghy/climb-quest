import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "legendary" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:   "bg-accent/90 text-accent-foreground border-accent hover:bg-accent",
  secondary: "bg-secondary text-foreground border-border hover:bg-secondary/70",
  danger:    "bg-boss/90 text-foreground border-boss hover:bg-boss",
  legendary: "bg-gradient-to-r from-legendary/90 to-accent/90 text-primary-foreground border-legendary/60 hover:brightness-110",
  ghost:     "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/60",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-sm",
};

export const GameButton = React.forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        {...rest}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-medium rounded-md border",
          "select-none whitespace-nowrap",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "active:translate-y-[1px]",
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

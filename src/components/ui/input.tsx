import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border-2 border-[hsl(var(--panel-frame))] bg-[hsl(var(--background))]/80 px-3 py-2 text-base text-foreground",
          "placeholder:text-muted-foreground",
          "shadow-[inset_0_2px_0_hsl(0_0%_0%/0.45),inset_0_-1px_0_hsl(0_0%_100%/0.06),inset_0_0_0_1px_hsl(0_0%_0%/0.25)]",
          "transition-colors",
          "hover:border-[hsl(var(--btn-orange))] focus-visible:border-[hsl(var(--btn-orange))]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--btn-orange))]/40",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

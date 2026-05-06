import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border-2 border-[hsl(var(--panel-frame))] bg-[hsl(var(--background))]/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
        "shadow-[inset_0_2px_0_hsl(0_0%_0%/0.45),inset_0_-1px_0_hsl(0_0%_100%/0.06),inset_0_0_0_1px_hsl(0_0%_0%/0.25)]",
        "transition-colors hover:border-[hsl(var(--btn-orange))] focus-visible:border-[hsl(var(--btn-orange))]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--btn-orange))]/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

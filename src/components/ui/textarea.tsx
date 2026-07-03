import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, autoResize, ...props }, ref) => {
  const innerRef = React.useRef<HTMLTextAreaElement>(null);
  React.useImperativeHandle(ref, () => innerRef.current!);

  React.useEffect(() => {
    if (!autoResize) return;
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [autoResize]);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      const el = e.currentTarget;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
    props.onInput?.(e);
  };

  return (
    <textarea
      className={cn(
        "flex w-full rounded-md border-2 border-[hsl(var(--panel-frame))] bg-[hsl(var(--background))]/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
        autoResize ? "min-h-[40px] resize-none overflow-hidden" : "min-h-[80px]",
        "shadow-[inset_0_2px_0_hsl(0_0%_0%/0.45),inset_0_-1px_0_hsl(0_0%_100%/0.06),inset_0_0_0_1px_hsl(0_0%_0%/0.25)]",
        "transition-colors hover:border-[hsl(var(--btn-orange))] focus-visible:border-[hsl(var(--btn-orange))]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--btn-orange))]/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={innerRef}
      rows={autoResize ? 1 : props.rows}
      onInput={handleInput}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };

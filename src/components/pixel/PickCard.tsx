import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function PickCard({
  image,
  content,
  title,
  desc,
  onClick,
  ring,
  imageClassName,
  size = "default",
}: {
  image?: string;
  content?: ReactNode;
  title: string;
  desc: string;
  onClick?: () => void;
  ring: string;
  imageClassName?: string;
  size?: "default" | "sm";
}) {
  const isSm = size === "sm";
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group rounded-xl text-left border-2 border-[hsl(var(--panel-frame))] bg-secondary/50 overflow-hidden w-full h-full",
        "shadow-[inset_0_2px_0_hsl(0_0%_100%/0.06),inset_0_-3px_0_hsl(0_0%_0%/0.4),0_8px_18px_-10px_hsl(0_0%_0%/0.6)]",
        isSm ? "flex flex-col" : "flex sm:flex sm:flex-col",
        onClick && "hover:ring-4 transition active:translate-y-[2px]",
        ring,
      )}
    >
      <div className={cn(
        "shrink-0 overflow-hidden bg-black/60 grid place-items-center",
        isSm ? "h-auto w-full aspect-square" : "h-24 w-24 sm:h-auto sm:w-full sm:aspect-square"
      )}>
        {content
          ? content
          : image && (
              <img
                src={image}
                alt={title}
                className={cn("h-full w-full object-cover transition-transform group-hover:scale-105", imageClassName)}
              />
            )}
      </div>
      <div className={cn("min-w-0 flex-1", isSm ? "p-1.5" : "p-3 sm:p-4")}>
        <div className={cn("font-display font-bold leading-tight", isSm ? "text-[11px]" : "text-base sm:text-lg")}>{title}</div>
        <div className={cn("text-muted-foreground leading-snug", isSm ? "text-[10px] mt-0.5" : "text-xs mt-1")}>{desc}</div>
      </div>
    </Comp>
  );
}

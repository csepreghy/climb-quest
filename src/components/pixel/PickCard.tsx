import { cn } from "@/lib/utils";

export function PickCard({
  image,
  title,
  desc,
  onClick,
  ring,
}: {
  image: string;
  title: string;
  desc: string;
  onClick?: () => void;
  ring: string;
}) {
  const Comp: any = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "group rounded-xl text-left border-2 border-[hsl(var(--panel-frame))] bg-secondary/50 overflow-hidden w-full",
        "shadow-[inset_0_2px_0_hsl(0_0%_100%/0.06),inset_0_-3px_0_hsl(0_0%_0%/0.4),0_8px_18px_-10px_hsl(0_0%_0%/0.6)]",
        onClick && "hover:ring-4 transition active:translate-y-[2px]",
        ring,
      )}
    >
      <div className="aspect-square w-full overflow-hidden bg-black/40">
        <img src={image} alt={title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      </div>
      <div className="p-4">
        <div className="font-display font-bold text-lg">{title}</div>
        <div className="text-xs text-muted-foreground mt-1 leading-snug">{desc}</div>
      </div>
    </Comp>
  );
}

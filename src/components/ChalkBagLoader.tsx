import { cn } from "@/lib/utils";
import chalkBagLoader from "@/assets/chalk-bag-loader.webp";

interface ChalkBagLoaderProps {
  size?: number;
  className?: string;
  label?: string;
}

/** Bouncing chalk-bag loading indicator. Use anywhere we wait on data or images. */
export function ChalkBagLoader({ size = 64, className, label }: ChalkBagLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)} role="status" aria-label={label ?? "Loading"}>
      <img
        src={chalkBagLoader}
        alt=""
        width={size}
        height={size}
        className="animate-chalk-bounce drop-shadow-[0_4px_8px_hsl(0_0%_0%/0.4)]"
        style={{ width: size, height: size }}
      />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

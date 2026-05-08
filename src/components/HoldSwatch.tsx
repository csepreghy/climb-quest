import { cn } from "@/lib/utils";

/**
 * Renders a hold color swatch. If `hex2` is provided, draws a circle
 * split down the middle showing both colors.
 */
export function HoldSwatch({
  hex,
  hex2,
  className,
  style,
  title,
}: {
  hex: string;
  hex2?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}) {
  const bg = hex2
    ? `linear-gradient(90deg, ${hex} 0 50%, ${hex2} 50% 100%)`
    : hex;
  return (
    <span
      title={title}
      aria-label={title}
      className={cn("inline-block rounded-full border border-[hsl(var(--panel-frame))]", className)}
      style={{ background: bg, ...style }}
    />
  );
}

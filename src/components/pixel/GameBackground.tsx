/** Flat dark slate background with a subtle vignette (shadow, not color fill). */
export function GameBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,hsl(230_40%_2%/0.85)_100%)]" />
    </div>
  );
}

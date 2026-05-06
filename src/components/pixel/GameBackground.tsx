/** Warm cartoon-RPG menu background with vignette + soft warm wash. */
export function GameBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(28_70%_28%/0.45),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(18_70%_22%/0.40),transparent_60%),radial-gradient(ellipse_at_bottom_left,hsl(36_60%_22%/0.30),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,hsl(24_25%_4%/0.85)_100%)]" />
    </div>
  );
}

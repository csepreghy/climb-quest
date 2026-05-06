/** Calm RPG-menu background: soft gradient wash + subtle vignette. */
export function GameBackground() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(280_40%_14%/0.55),transparent_55%),radial-gradient(ellipse_at_bottom_right,hsl(220_40%_14%/0.45),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,hsl(240_10%_4%/0.7)_100%)]" />
    </div>
  );
}

import chalkBagImg from "@/assets/chalk-bag.png";

export function LoadingScreen() {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[hsl(var(--background))]"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at top, hsl(var(--background)) 0%, hsl(0 0% 4%) 100%)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <img
        src={chalkBagImg}
        alt=""
        className="h-20 w-20 object-contain drop-shadow-[0_8px_20px_hsl(42_100%_55%/0.4)] animate-chalk-bob"
      />
      <p className="mt-6 text-sm font-display tracking-widest uppercase text-muted-foreground">
        Chalking up...
      </p>
    </div>
  );
}

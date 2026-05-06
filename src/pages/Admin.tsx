import { ThemeStudio } from "@/components/ThemeStudio";

export default function Admin() {
  return (
    <div className="space-y-6 animate-float-up max-w-4xl">
      <div>
        <p className="text-sm text-muted-foreground">
          Mix and match background, header, boxes, and character. Saved automatically.
        </p>
      </div>
      <div className="rpg-panel p-5" style={{ background: "hsl(var(--panel-fill))" }}>
        <ThemeStudio />
      </div>
    </div>
  );
}

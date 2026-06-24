import { useEffect, useMemo, useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CardLabConfig,
  DEFAULT_CONFIG,
  PRESETS,
  buildCss,
  applyGlobalCss,
  loadSavedState,
  saveState,
  ThreeDStyle,
  EdgeStyle,
  BottomStyle,
  TexTint,
} from "./cardLabPresets";
import { toast } from "sonner";
import { Copy, RotateCcw } from "lucide-react";

const PREVIEW_CLASS = "cq-card-lab-preview";

export function CardLab() {
  const initial = useMemo(loadSavedState, []);
  const [config, setConfig] = useState<CardLabConfig>(initial.config);
  const [global, setGlobal] = useState<boolean>(initial.global);
  const [presetKey, setPresetKey] = useState<string>("current");

  // Persist + apply
  useEffect(() => {
    saveState(config, global);
    applyGlobalCss(global ? config : null);
  }, [config, global]);

  // Cleanup on unmount: keep global style if user enabled it; otherwise ensure removed.
  useEffect(() => {
    return () => {
      if (!global) applyGlobalCss(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof CardLabConfig>(k: K, v: CardLabConfig[K]) =>
    setConfig((c) => ({ ...c, [k]: v }));

  const onPreset = (key: string) => {
    setPresetKey(key);
    const p = PRESETS[key];
    if (p) setConfig({ ...p.config });
  };

  const onReset = () => {
    setConfig({ ...DEFAULT_CONFIG });
    setPresetKey("current");
  };

  const onCopy = async () => {
    const css = buildCss(".rpg-panel", config);
    try {
      await navigator.clipboard.writeText(css);
      toast.success("CSS copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  };

  const previewCss = useMemo(() => buildCss(`.${PREVIEW_CLASS} .rpg-panel`, config), [config]);

  return (
    <div className="space-y-4">
      {/* Preview-scoped style (only renders when global is off, to avoid double rules) */}
      {!global && <style>{previewCss}</style>}

      {/* Top bar */}
      <GameCard className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Preset</Label>
            <Select value={presetKey} onValueChange={onPreset}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRESETS).map(([key, p]) => (
                  <SelectItem key={key} value={key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Label htmlFor="apply-global" className="text-sm">Apply globally</Label>
            <Switch id="apply-global" checked={global} onCheckedChange={setGlobal} />
          </div>

          <GameButton variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" /> Reset
          </GameButton>
          <GameButton variant="primary" size="sm" onClick={onCopy}>
            <Copy className="h-4 w-4" /> Copy CSS
          </GameButton>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Tweaks persist in your browser. "Apply globally" overrides every card in the app so you can browse around.
        </p>
      </GameCard>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
        {/* Controls */}
        <GameCard className="p-5 space-y-6 lg:sticky lg:top-24 self-start">
          <Section title="Fill color">
            <SliderRow label="Hue" value={config.hue} min={0} max={360} step={1} onChange={(v) => set("hue", v)} suffix="°" />
            <SliderRow label="Saturation" value={config.sat} min={0} max={60} step={1} onChange={(v) => set("sat", v)} suffix="%" />
            <SliderRow label="Lightness" value={config.light} min={1} max={14} step={1} onChange={(v) => set("light", v)} suffix="%" />
            <Swatch hue={config.hue} sat={config.sat} light={config.light} />
          </Section>

          <Section title="Rocky texture">
            <SliderRow label="Intensity" value={Math.round(config.texOpacity * 100)} min={0} max={100} step={1}
              onChange={(v) => set("texOpacity", v / 100)} suffix="%" />
            <SliderRow label="Coarseness" value={Math.round(config.texFreq * 100)} min={40} max={140} step={5}
              onChange={(v) => set("texFreq", v / 100)} />
            <RadioRow<TexTint>
              label="Grain tint"
              value={config.texTint}
              options={[{ v: "dark", l: "Dark" }, { v: "gold", l: "Gold" }]}
              onChange={(v) => set("texTint", v)}
            />
          </Section>

          <Section title="3D effect">
            <RadioRow<ThreeDStyle>
              label=""
              value={config.threeD}
              stacked
              options={[
                { v: "flat", l: "Flat" },
                { v: "inset", l: "Inset well" },
                { v: "raised", l: "Raised plate (RPG)" },
                { v: "lithograph", l: "Floating lithograph" },
                { v: "relief", l: "Carved relief" },
              ]}
              onChange={(v) => set("threeD", v)}
            />
          </Section>

          <Section title="Edge treatment">
            <RadioRow<EdgeStyle>
              label=""
              value={config.edge}
              stacked
              options={[
                { v: "none", l: "None" },
                { v: "gold-top", l: "Gold hairline (top)" },
                { v: "gold-all", l: "Gold hairline (all sides)" },
                { v: "chiseled", l: "Chiseled bevel" },
              ]}
              onChange={(v) => set("edge", v)}
            />
          </Section>

          <Section title="Bottom border">
            <RadioRow<BottomStyle>
              label="Style"
              value={config.bottom}
              stacked={false}
              options={[
                { v: "none", l: "None" },
                { v: "solid", l: "Solid border" },
                { v: "fade", l: "Gradient fade" },
              ]}
              onChange={(v) => set("bottom", v)}
            />

            {config.bottom !== "none" && (
              <div className="space-y-4 pt-2 border-t border-border/40 mt-2">
                <SliderRow
                  label="Height / Thickness"
                  value={config.bottomHeight ?? 3}
                  min={1}
                  max={12}
                  step={1}
                  onChange={(v) => set("bottomHeight", v)}
                  suffix="px"
                />

                <RadioRow<BottomColorType>
                  label="Color type"
                  value={config.bottomColorType ?? "gold"}
                  stacked={false}
                  options={[
                    { v: "gold", l: "Gold" },
                    { v: "dark", l: "Dark" },
                    { v: "custom", l: "Custom" },
                  ]}
                  onChange={(v) => set("bottomColorType", v)}
                />

                {config.bottomColorType === "custom" && (
                  <div className="space-y-3 p-3 bg-secondary/20 rounded-lg border border-border/40">
                    <SliderRow
                      label="Color Hue"
                      value={config.bottomHue ?? 45}
                      min={0}
                      max={360}
                      step={1}
                      onChange={(v) => set("bottomHue", v)}
                      suffix="°"
                    />
                    <SliderRow
                      label="Color Saturation"
                      value={config.bottomSat ?? 85}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(v) => set("bottomSat", v)}
                      suffix="%"
                    />
                    <SliderRow
                      label="Color Lightness"
                      value={config.bottomLight ?? 50}
                      min={0}
                      max={100}
                      step={1}
                      onChange={(v) => set("bottomLight", v)}
                      suffix="%"
                    />
                  </div>
                )}

                <SliderRow
                  label="Border Opacity"
                  value={Math.round((config.bottomOpacity ?? 1) * 100)}
                  min={0}
                  max={100}
                  step={5}
                  onChange={(v) => set("bottomOpacity", v / 100)}
                  suffix="%"
                />
              </div>
            )}
          </Section>

          <Section title="Border radius">
            <SliderRow label="" value={config.radius} min={0} max={24} step={1} onChange={(v) => set("radius", v)} suffix="px" />
          </Section>
        </GameCard>

        {/* Preview */}
        <div className={`${PREVIEW_CLASS} space-y-4`}>
          <GameCard className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Sample card</div>
            <h3 className="text-xl font-bold tracking-tight mb-1">Daily Streak</h3>
            <p className="text-sm text-muted-foreground">
              Three days in a row. Keep it going and your chalk multiplier climbs.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <GameButton variant="primary" size="sm">Log session</GameButton>
              <span className="text-xs text-muted-foreground">142 / 500 XP</span>
            </div>
          </GameCard>

          <div className="grid sm:grid-cols-2 gap-4">
            <GameCard className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Strength tier</div>
              <div className="text-2xl font-bold">Granite</div>
              <div className="text-xs text-muted-foreground mt-1">Rolling 7-day hang seconds</div>
            </GameCard>
            <GameCard className="p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Bosses sent</div>
              <div className="text-2xl font-bold">17</div>
              <div className="text-xs text-muted-foreground mt-1">All-time</div>
            </GameCard>
          </div>

          <GameCard className="p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Wide content card</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use this surface to evaluate how text reads at body sizes against the rocky background.
              Adjust intensity, hue, and 3D style on the left until cards sit naturally on the stone
              without competing with the gold contour lines behind them.
            </p>
          </GameCard>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-[0.18em] font-bold text-foreground/80">{title}</div>
      {children}
    </div>
  );
}

function SliderRow({
  label, value, min, max, step, onChange, suffix,
}: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; suffix?: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        {label && <span className="text-muted-foreground">{label}</span>}
        <span className="tabular-nums ml-auto">{value}{suffix}</span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

function RadioRow<T extends string>({
  label, value, options, onChange, stacked,
}: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; stacked?: boolean }) {
  return (
    <div className="space-y-1.5">
      {label && <div className="text-xs text-muted-foreground">{label}</div>}
      <div className={stacked ? "grid grid-cols-1 gap-1.5" : "flex flex-wrap gap-1.5"}>
        {options.map((o) => {
          const active = o.v === value;
          return (
            <button
              key={o.v}
              type="button"
              onClick={() => onChange(o.v)}
              className={[
                "text-left text-xs px-3 py-2 rounded-md border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/40 border-border hover:bg-secondary",
              ].join(" ")}
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Swatch({ hue, sat, light }: { hue: number; sat: number; light: number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div
        className="h-6 w-6 rounded border border-border"
        style={{ background: `hsl(${hue} ${sat}% ${light}%)` }}
      />
      <span className="tabular-nums">hsl({hue} {sat}% {light}%)</span>
    </div>
  );
}

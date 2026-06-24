import { useEffect, useState } from "react";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  DEFAULT_TOPO,
  TopoConfig,
  loadTopoLocal,
  setTopoConfig,
  saveRemoteTopo,
  TOPO_LS_KEY,
} from "./topoPresets";

export function TopoLab() {
  const [cfg, setCfg] = useState<TopoConfig>(() => loadTopoLocal());
  const [saving, setSaving] = useState(false);

  // Push every tweak live so the admin sees it immediately.
  useEffect(() => {
    setTopoConfig(cfg, true);
  }, [cfg]);

  const update = <K extends keyof TopoConfig>(key: K, value: TopoConfig[K]) =>
    setCfg(prev => ({ ...prev, [key]: value }));

  async function publish() {
    setSaving(true);
    try {
      await saveRemoteTopo(cfg);
      toast.success("Topographic background published to everyone");
    } catch (e: any) {
      toast.error(e?.message ?? "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setCfg(DEFAULT_TOPO);
    try { localStorage.removeItem(TOPO_LS_KEY); } catch {}
    toast.info("Reset to default");
  }

  return (
    <GameCard tone="legendary" className="p-5 space-y-6">
      <div>
        <div className="menu-label mb-1">Admin · Topographic Background</div>
        <p className="text-xs text-muted-foreground">
          Tweaks apply live to your screen. Click <span className="font-bold">Publish to all</span> to push to every visitor.
        </p>
      </div>

      {/* On/off + animation toggles */}
      <div className="grid sm:grid-cols-2 gap-4">
        <ToggleRow
          label="Background enabled"
          hint="Turn the whole topo layer off (keeps the solid near-black base)."
          checked={cfg.enabled}
          onChange={v => update("enabled", v)}
        />
        <ToggleRow
          label="Animate contours"
          hint="Slowly evolve the noise field so contour lines drift."
          checked={cfg.animated}
          onChange={v => update("animated", v)}
        />
      </div>

      {/* Animation speed */}
      <SliderRow
        label="Animation speed"
        value={cfg.speed}
        min={0.0001}
        max={0.01}
        step={0.0001}
        disabled={!cfg.animated || !cfg.enabled}
        format={v => `${(v * 1000).toFixed(2)} / frame`}
        onChange={v => update("speed", v)}
      />

      {/* Lines count */}
      <SliderRow
        label="Number of contour lines"
        value={cfg.levels}
        min={1} max={24} step={1}
        disabled={!cfg.enabled}
        format={v => `${v}`}
        onChange={v => update("levels", Math.round(v))}
      />

      <SliderRow
        label="Line opacity"
        value={cfg.lineOpacity}
        min={0} max={1} step={0.01}
        disabled={!cfg.enabled}
        format={v => `${(v * 100).toFixed(0)}%`}
        onChange={v => update("lineOpacity", v)}
      />

      <SliderRow
        label="Line thickness"
        value={cfg.lineWidth}
        min={0.3} max={2.5} step={0.1}
        disabled={!cfg.enabled}
        format={v => `${v.toFixed(1)}px`}
        onChange={v => update("lineWidth", v)}
      />

      <SliderRow
        label="Noise scale (busyness)"
        value={cfg.noiseScale}
        min={0.0008} max={0.012} step={0.0002}
        disabled={!cfg.enabled}
        format={v => v.toFixed(4)}
        onChange={v => update("noiseScale", v)}
      />

      <SliderRow
        label="Stone texture strength"
        value={cfg.textureOpacity}
        min={0} max={1} step={0.05}
        disabled={!cfg.enabled}
        format={v => `${(v * 100).toFixed(0)}%`}
        onChange={v => update("textureOpacity", v)}
      />

      {/* Color */}
      <div className="grid sm:grid-cols-3 gap-3">
        <SliderRow
          compact
          label="Hue"
          value={cfg.contourHue}
          min={0} max={360} step={1}
          disabled={!cfg.enabled}
          format={v => `${Math.round(v)}°`}
          onChange={v => update("contourHue", Math.round(v))}
        />
        <SliderRow
          compact
          label="Saturation"
          value={cfg.contourSat}
          min={0} max={100} step={1}
          disabled={!cfg.enabled}
          format={v => `${Math.round(v)}%`}
          onChange={v => update("contourSat", Math.round(v))}
        />
        <SliderRow
          compact
          label="Lightness"
          value={cfg.contourLight}
          min={0} max={100} step={1}
          disabled={!cfg.enabled}
          format={v => `${Math.round(v)}%`}
          onChange={v => update("contourLight", Math.round(v))}
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        <GameButton variant="legendary" onClick={publish} disabled={saving}>
          {saving ? "Publishing…" : "Publish to all"}
        </GameButton>
        <Button variant="secondary" onClick={reset}>Reset to default</Button>
      </div>
    </GameCard>
  );
}

function ToggleRow({
  label, hint, checked, onChange,
}: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none rounded-md border border-border/40 p-3">
      <Switch checked={checked} onCheckedChange={onChange} />
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </label>
  );
}

function SliderRow({
  label, value, min, max, step, onChange, format, disabled, compact,
}: {
  label: string;
  value: number;
  min: number; max: number; step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  disabled?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "space-y-1.5"}>
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
        <span className="text-xs tabular-nums text-foreground/80">{format ? format(value) : value}</span>
      </div>
      <Slider
        value={[value]}
        min={min} max={max} step={step}
        onValueChange={([v]) => onChange(v)}
        disabled={disabled}
      />
    </div>
  );
}

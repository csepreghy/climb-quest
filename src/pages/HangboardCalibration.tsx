import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GameButton } from "@/components/ui/game-button";
import { GameCard } from "@/components/ui/game-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, RotateCcw, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { BEASTMAKER_1000_HOLDS, type HangboardHold } from "@/game/hangboard/beastmaker1000";
import {
  holdsToCalibrationDoc,
  mergeHolds,
  useHangboardCalibration,
  useSaveCalibration,
} from "@/game/hangboard/calibration";
import boardAsset from "@/assets/hangboard-beastmaker1000.webp.asset.json";
import { toast } from "sonner";

type Selection = { holdId: string; posIndex: number } | null;
type DragMode = "move" | "resize" | null;

export default function HangboardCalibration() {
  const nav = useNavigate();
  const { data: stored } = useHangboardCalibration();
  const saver = useSaveCalibration();

  const [holds, setHolds] = useState<HangboardHold[]>(() => mergeHolds(BEASTMAKER_1000_HOLDS, stored ?? null));
  useEffect(() => {
    if (stored !== undefined) setHolds(mergeHolds(BEASTMAKER_1000_HOLDS, stored));
  }, [stored]);

  const [selected, setSelected] = useState<Selection>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; orig: { x: number; y: number; w: number; h: number } } | null>(null);

  const selectedHold = useMemo(() => holds.find(h => h.id === selected?.holdId) ?? null, [holds, selected]);
  const selectedPos = selectedHold && selected ? selectedHold.positions[selected.posIndex] : null;

  function updateSelected(patch: Partial<{ x: number; y: number; w: number; h: number }>) {
    if (!selected) return;
    setHolds(prev => prev.map(h => {
      if (h.id !== selected.holdId) return h;
      const positions = h.positions.map((p, i) => i === selected.posIndex ? { ...p, ...patch } : p);
      return { ...h, positions };
    }));
  }

  function renameSelected(label: string) {
    if (!selected) return;
    setHolds(prev => prev.map(h => h.id === selected.holdId ? { ...h, label } : h));
  }

  function setSelectedNumber(num: number) {
    if (!selected) return;
    setHolds(prev => prev.map(h => h.id === selected.holdId ? { ...h, number: num } : h));
  }

  function addPositionToSelected() {
    if (!selected) return;
    setHolds(prev => prev.map(h => {
      if (h.id !== selected.holdId) return h;
      const last = h.positions[h.positions.length - 1] ?? { x: 45, y: 45, w: 10, h: 10 };
      // Mirror horizontally around 50%
      const mirroredX = clamp(100 - last.x - last.w, 0, 100 - last.w);
      const newPos = { ...last, x: mirroredX };
      return { ...h, positions: [...h.positions, newPos] };
    }));
    const h = holds.find(x => x.id === selected.holdId);
    if (h) setSelected({ holdId: h.id, posIndex: h.positions.length });
  }

  function removeSelectedPosition() {
    if (!selected) return;
    const h = holds.find(x => x.id === selected.holdId);
    if (!h || h.positions.length <= 1) return;
    setHolds(prev => prev.map(x => x.id === h.id ? { ...x, positions: x.positions.filter((_, i) => i !== selected.posIndex) } : x));
    setSelected({ holdId: h.id, posIndex: 0 });
  }

  function addHold() {
    const nextNum = Math.max(0, ...holds.map(h => h.number)) + 1;
    const id = `custom_${Date.now().toString(36)}`;
    const newHold: HangboardHold = {
      id, number: nextNum, label: `New hold ${nextNum}`, type: "edge",
      positions: [{ x: 45, y: 45, w: 10, h: 10 }],
    };
    setHolds(prev => [...prev, newHold]);
    setSelected({ holdId: id, posIndex: 0 });
  }

  function deleteSelected() {
    if (!selected) return;
    const h = holds.find(x => x.id === selected.holdId);
    if (!h) return;
    const isBase = BEASTMAKER_1000_HOLDS.some(b => b.id === h.id);
    if (isBase) {
      toast.error("Built-in holds can't be deleted. You can rename or reposition them.");
      return;
    }
    if (!confirm(`Delete "${h.label}"?`)) return;
    setHolds(prev => prev.filter(x => x.id !== h.id));
    setSelected(null);
  }

  function startDrag(e: React.PointerEvent, mode: DragMode) {
    if (!selectedPos || !boardRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      orig: { x: selectedPos.x, y: selectedPos.y, w: selectedPos.w, h: selectedPos.h },
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    const rect = boardRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dxPct = ((e.clientX - d.startX) / rect.width) * 100;
    const dyPct = ((e.clientY - d.startY) / rect.height) * 100;
    if (d.mode === "move") {
      updateSelected({
        x: clamp(d.orig.x + dxPct, 0, 100 - d.orig.w),
        y: clamp(d.orig.y + dyPct, 0, 100 - d.orig.h),
      });
    } else if (d.mode === "resize") {
      updateSelected({
        w: clamp(d.orig.w + dxPct, 1, 100 - d.orig.x),
        h: clamp(d.orig.h + dyPct, 1, 100 - d.orig.y),
      });
    }
  }
  function endDrag(e: React.PointerEvent) {
    dragRef.current = null;
    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  }

  async function onSave() {
    try {
      await saver.mutateAsync(holdsToCalibrationDoc(holds));
      toast.success("Hangboard calibration saved");
    } catch (err) {
      toast.error(`Save failed: ${(err as Error).message}`);
    }
  }

  function onReset() {
    if (!confirm("Reset all positions to the built-in defaults? (You'll still need to Save afterward.)")) return;
    setHolds(BEASTMAKER_1000_HOLDS);
    setSelected(null);
  }

  return (
    <div className="space-y-4 animate-float-up">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <GameButton variant="ghost" size="sm" onClick={() => nav("/admin")}><ArrowLeft className="h-4 w-4" /> Back</GameButton>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hangboard calibration</h1>
            <p className="text-sm text-muted-foreground">Drag a hold to move it. Drag its corner to resize. Mirrored holds share an id — each side is its own position (1 = left, 2 = right).</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <GameButton variant="ghost" size="sm" onClick={addHold}><Plus className="h-4 w-4" /> Add hold</GameButton>
          <GameButton variant="ghost" size="sm" onClick={onReset}><RotateCcw className="h-4 w-4" /> Reset</GameButton>
          <GameButton variant="primary" size="sm" onClick={onSave} disabled={saver.isPending}>
            <Save className="h-4 w-4" /> {saver.isPending ? "Saving…" : "Save"}
          </GameButton>
        </div>
      </div>

      <GameCard className="p-3">
        <div
          ref={boardRef}
          className="relative w-full max-w-[1400px] mx-auto select-none touch-none"
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <img
            src={boardAsset.url}
            alt="Beastmaker 1000"
            width={1920}
            height={640}
            className="block w-full h-auto rounded-xl border-2 border-[hsl(var(--panel-frame))] shadow-lg pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0">
            {holds.flatMap(h => h.positions.map((p, i) => {
              const isSel = selected?.holdId === h.id && selected.posIndex === i;
              return (
                <div
                  key={`${h.id}-${i}`}
                  role="button"
                  tabIndex={0}
                  onPointerDown={e => {
                    setSelected({ holdId: h.id, posIndex: i });
                    startDrag(e, "move");
                  }}
                  className={
                    "absolute rounded-md flex items-center justify-center text-white font-extrabold drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] cursor-move " +
                    (isSel
                      ? "ring-4 ring-[hsl(var(--btn-orange))] bg-[hsl(var(--btn-orange))]/30"
                      : "ring-2 ring-cyan-400/80 bg-cyan-400/15 hover:bg-cyan-400/30")
                  }
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%` }}
                >
                  <span className="text-base sm:text-lg tabular-nums pointer-events-none">{h.number}<sub className="text-[10px] opacity-75">{i + 1}</sub></span>
                  {isSel && (
                    <div
                      onPointerDown={e => startDrag(e, "resize")}
                      className="absolute -right-2 -bottom-2 h-4 w-4 rounded-sm bg-white border-2 border-[hsl(var(--btn-orange))] cursor-se-resize"
                    />
                  )}
                </div>
              );
            }))}
          </div>
        </div>
      </GameCard>

      <GameCard className="p-4 space-y-3">
        {!selectedHold || !selectedPos ? (
          <p className="text-sm text-muted-foreground">Click any hold on the board above to select it.</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Selected</div>
                <div className="font-bold">#{selectedHold.number} · {selectedHold.label} · pos {selected!.posIndex + 1} / {selectedHold.positions.length}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedHold.positions.length > 1 && (
                  <GameButton variant="ghost" size="sm" onClick={() => setSelected(s => s ? { ...s, posIndex: (s.posIndex + 1) % selectedHold.positions.length } : s)}>
                    Switch side
                  </GameButton>
                )}
                <GameButton variant="ghost" size="sm" onClick={addPositionToSelected}>
                  <Plus className="h-4 w-4" /> Add position
                </GameButton>
                {selectedHold.positions.length > 1 && (
                  <GameButton variant="ghost" size="sm" onClick={removeSelectedPosition}>
                    <Trash2 className="h-4 w-4" /> Remove position
                  </GameButton>
                )}
                {!BEASTMAKER_1000_HOLDS.some(b => b.id === selectedHold.id) && (
                  <GameButton variant="danger" size="sm" onClick={deleteSelected}><Trash2 className="h-4 w-4" /> Delete hold</GameButton>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px] gap-3">
              <div>
                <Label className="text-xs">Hold name</Label>
                <Input value={selectedHold.label} onChange={e => renameSelected(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Number</Label>
                <Input
                  type="number"
                  min={1}
                  value={selectedHold.number}
                  onChange={e => setSelectedNumber(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumField label="x %" value={selectedPos.x} onChange={v => updateSelected({ x: v })} />
              <NumField label="y %" value={selectedPos.y} onChange={v => updateSelected({ y: v })} />
              <NumField label="width %" value={selectedPos.w} onChange={v => updateSelected({ w: v })} />
              <NumField label="height %" value={selectedPos.h} onChange={v => updateSelected({ h: v })} />
            </div>
          </>
        )}
      </GameCard>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        step={0.1}
        value={Number.isFinite(value) ? value.toFixed(2) : "0"}
        onChange={e => onChange(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
      />
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

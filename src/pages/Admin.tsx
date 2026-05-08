import { useState } from "react";
import { ThemeStudio } from "@/components/ThemeStudio";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminAdjustChalk, adminSetLevel, adminSetIgnoreLevelReq, adminSeedMockData, resetGame, resetOnboarding, useGame } from "@/game/store";
import { useAuth } from "@/hooks/useAuth";
import { useActiveSlot, snapshotActiveSlot } from "@/game/adminAccounts";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Minus, Upload, Trash2, Pencil, X } from "lucide-react";
import {
  useAllItems,
  addCustomItem,
  updateCustomItem,
  deleteCustomItem,
  isImageEmoji,
  backfillShopImages,
  CustomItemInput,
} from "@/game/customItems";
import { ItemGroup, Rarity, Slot, ShopItem, LEVELS, Gender } from "@/game/data";
import { useLevelOverrides, resolvedLevel, saveLevel, clearLevel, hasAnyOverride } from "@/game/levelOverrides";
import { cn } from "@/lib/utils";
import {
  usePublicGyms,
  addPublicGym, updatePublicGym, deletePublicGym,
  addPublicHoldColor, removePublicHoldColor, togglePublicGymGradingSystem,
  addPublicGymCustomGrading, updatePublicGymCustomGrading, deletePublicGymCustomGrading,
} from "@/game/publicGyms";
import { COUNTRIES } from "@/game/countries";
import { AddHoldColor } from "@/components/AddHoldColor";
import { HoldSwatch } from "@/components/HoldSwatch";
import { GymGradingEditor } from "@/components/GymGradingEditor";
import { RebalancePreviewModal } from "@/components/RebalancePreviewModal";


const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary"];
const GROUP_OPTIONS: { value: ItemGroup; label: string }[] = [
  { value: "outfit", label: "Outfit" },
  { value: "gear", label: "Gear" },
  { value: "power", label: "Power-ups" },
];
const CATEGORIES_BY_GROUP: Record<ItemGroup, ShopItem["category"][]> = {
  outfit: ["Top", "Pants", "Shoes", "Hat", "Hand"],
  gear: ["Brushes", "Chalk", "Study"],
  power: ["Accessories", "Auras", "Titles", "Consumables"],
};
const CATEGORY_TO_SLOT: Record<string, Slot> = {
  Top: "outfit", Pants: "bottoms", Shoes: "shoes", Hat: "hat", Hand: "hand",
  Brushes: "accessory", Chalk: "chalk", Study: "study",
  Accessories: "accessory", Auras: "aura", Titles: "title", Consumables: "accessory",
};

export default function Admin() {
  const s = useGame();
  const { user } = useAuth();
  const slot = useActiveSlot(user?.id ?? null);
  const [amount, setAmount] = useState(100);
  return (
    <div className="space-y-6 animate-float-up max-w-5xl">
      {slot === "test" && (
        <GameCard tone="legendary" className="p-5">
          <div className="menu-label mb-3">Admin · Reset Test Account</div>
          <p className="text-sm text-muted-foreground mb-3">
            Wipe all chalk, logs, levels, inventory, and bosses on your test account. Your personal account is unaffected.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive"><Trash2 className="h-4 w-4" /> Reset test account to 0</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset test account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This clears chalk, logs, level, inventory, and bosses on the active test account. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    resetGame();
                    if (user) snapshotActiveSlot(user.id);
                    toast.success("Test account reset");
                  }}
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </GameCard>
      )}
      <GameCard tone="legendary" className="p-5">
        <div className="menu-label mb-3">Admin · Onboarding</div>
        <p className="text-sm text-muted-foreground mb-3">
          Reset the first-time onboarding flow on this account so you can watch it again.
        </p>
        <Button variant="secondary" onClick={() => { resetOnboarding(); toast.success("Onboarding reset — reload to see it"); }}>
          Replay onboarding
        </Button>
      </GameCard>
      <GameCard tone="legendary" className="p-5">
        <div className="menu-label mb-3">Admin · Chalk Controls</div>
        <div className="text-sm text-muted-foreground mb-3">Current balance: <span className="gradient-chalk-text font-bold tabular-nums">{s.chalk.toLocaleString()}</span></div>
        <div className="flex gap-2">
          <Input type="number" value={amount} min={1} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="max-w-32" />
          <Button variant="default" onClick={() => { adminAdjustChalk(amount); toast.success(`+${amount} Chalk`); }}>
            <Plus className="h-4 w-4" /> Add
          </Button>
          <Button variant="secondary" onClick={() => { adminAdjustChalk(-amount); toast.info(`-${amount} Chalk`); }}>
            <Minus className="h-4 w-4" /> Subtract
          </Button>
        </div>
      </GameCard>

      <GameCard tone="accent" className="p-5">
        <div className="menu-label mb-3">Admin · Level Controls</div>
        <div className="text-sm text-muted-foreground mb-3">Current level: <span className="font-bold tabular-nums">{s.level}</span></div>
        <div className="flex gap-2">
          <Button variant="default" onClick={() => { adminSetLevel(1); toast.success("Level +1"); }}>
            <Plus className="h-4 w-4" /> Level Up
          </Button>
          <Button variant="secondary" onClick={() => { adminSetLevel(-1); toast.info("Level -1"); }}>
            <Minus className="h-4 w-4" /> Level Down
          </Button>
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[hsl(var(--btn-orange))]"
            checked={!!s.ignoreLevelReq}
            onChange={e => { adminSetIgnoreLevelReq(e.target.checked); toast.info(e.target.checked ? "Level requirements disabled" : "Level requirements enabled"); }}
          />
          <span>Ignore level requirements (shop)</span>
        </label>
      </GameCard>

      <GameCard tone="accent" className="p-5">
        <div className="menu-label mb-3">Admin · Mock Data</div>
        <p className="text-sm text-muted-foreground mb-3">Add sample boulder logs and bosses for testing UI states.</p>
        <Button onClick={() => { adminSeedMockData(); toast.success("Mock data added"); }}>
          <Plus className="h-4 w-4" /> Seed mock boulders & bosses
        </Button>
      </GameCard>

      <BackfillImagesCard />

      <LevelsAdmin />

      <RebalanceCard />

      <InventoryAdmin />

      <PublicGymsAdmin />

      <div className="rpg-panel p-5" style={{ background: "hsl(var(--panel-fill))" }}>
        <ThemeStudio />
      </div>
    </div>
  );
}

function BackfillImagesCard() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; label: string } | null>(null);
  const [result, setResult] = useState<{ converted: number; skipped: number; failed: number } | null>(null);

  async function run() {
    setBusy(true); setResult(null);
    try {
      const r = await backfillShopImages((done, total, label) => setProgress({ done, total, label }));
      setResult(r);
      toast.success(`Backfill complete: ${r.converted} converted, ${r.skipped} already up-to-date, ${r.failed} failed`);
    } catch (e: any) {
      toast.error(e?.message ?? "Backfill failed");
    } finally { setBusy(false); setProgress(null); }
  }

  return (
    <GameCard tone="accent" className="p-5">
      <div className="menu-label mb-3">Admin · Image Backfill</div>
      <p className="text-sm text-muted-foreground mb-3">
        Convert legacy base64 item images to 800px webp in cloud storage. One-off operation; safe to re-run.
      </p>
      <div className="flex items-center gap-3">
        <Button onClick={run} disabled={busy}>{busy ? "Working…" : "Run backfill"}</Button>
        {progress && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {progress.done}/{progress.total} · {progress.label}
          </span>
        )}
        {result && !busy && (
          <span className="text-xs text-muted-foreground">
            ✓ {result.converted} converted · {result.skipped} skipped · {result.failed} failed
          </span>
        )}
      </div>
    </GameCard>
  );
}

function RebalanceCard() {
  const [open, setOpen] = useState(false);
  return (
    <GameCard tone="legendary" className="p-5">
      <div className="menu-label mb-3">Admin · Rebalance economy</div>
      <p className="text-sm text-muted-foreground mb-3">
        Recompute every shop item's price, chalk bonus and discount from rarity + level. Optionally retune activity rewards too. Preview before applying.
      </p>
      <Button onClick={() => setOpen(true)}>Preview rebalance</Button>
      <RebalancePreviewModal open={open} onClose={() => setOpen(false)} />
    </GameCard>
  );
}

const empty: CustomItemInput = {
  name: "",
  group: "outfit",
  category: "Top",
  slot: "outfit",
  rarity: "common",
  price: 100,
  bonusPct: 0,
  imageDataUrl: undefined,
  levelReq: undefined,
  discountPct: 0,
};

function InventoryAdmin() {
  const all = useAllItems();
  const [draft, setDraft] = useState<CustomItemInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() { setDraft(empty); setEditingId(null); }

  async function pickImage(file: File) {
    if (file.size > 20 * 1024 * 1024) { toast.error("Image too large (max 20 MB)"); return; }
    // Show local preview immediately; actual upload happens in save() (resized to 800px webp).
    const previewUrl = URL.createObjectURL(file);
    setDraft(d => ({ ...d, imageDataUrl: previewUrl, imageFile: file }));
  }

  async function save() {
    if (!draft.name.trim()) { toast.error("Name required"); return; }
    if (draft.price < 0) { toast.error("Price can't be negative"); return; }
    setBusy(true);
    try {
      if (editingId) {
        await updateCustomItem(editingId, draft);
        toast.success("Item updated");
      } else {
        await addCustomItem(draft);
        toast.success("Item created");
      }
      reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally { setBusy(false); }
  }

  function startEdit(item: ShopItem) {
    setEditingId(item.id);
    setDraft({
      name: item.name,
      group: item.group,
      category: item.category,
      slot: item.slot,
      rarity: item.rarity,
      price: item.price,
      bonusPct: item.bonus ? Math.round(item.bonus.mult * 100) : 0,
      imageDataUrl: isImageEmoji(item.emoji) ? item.emoji : undefined,
      appliesTo: item.bonus?.appliesTo,
      levelReq: item.levelReq,
      discountPct: item.priceMult ? Math.round((1 - item.priceMult) * 100) : 0,
    });
  }

  return (
    <GameCard tone="accent" className="p-5 space-y-5">
      <div>
        <div className="menu-label">Inventory items</div>
        <p className="text-xs text-muted-foreground mt-1">Create custom shop items, upload an image, set rarity, price and chalk bonus.</p>
      </div>

      {/* Form */}
      <div className="grid gap-3 md:grid-cols-[120px,1fr]">
        {/* Image picker */}
        <div className="space-y-2">
          <Label className="text-xs">Image</Label>
          <label className="flex flex-col items-center justify-center h-28 w-28 rounded-lg border-2 border-dashed border-[hsl(var(--panel-frame))] bg-secondary/40 cursor-pointer hover:border-[hsl(var(--btn-orange))] overflow-hidden">
            {draft.imageDataUrl
              ? <img src={draft.imageDataUrl} alt="" className="h-full w-full object-contain" />
              : <div className="text-center text-muted-foreground text-xs"><Upload className="h-5 w-5 mx-auto mb-1" />Upload</div>}
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) pickImage(f); }} />
          </label>
          {draft.imageDataUrl && (
            <button className="text-[10px] text-muted-foreground hover:text-destructive" onClick={() => setDraft(d => ({ ...d, imageDataUrl: undefined }))}>Clear</button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-xs">Name</Label>
            <Input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Send Slippers" />
          </div>
          <div>
            <Label className="text-xs">Rarity</Label>
            <Select value={draft.rarity} onValueChange={v => setDraft(d => ({ ...d, rarity: v as Rarity }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {RARITIES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Group</Label>
            <Select value={draft.group} onValueChange={v => {
              const g = v as ItemGroup;
              const cat = CATEGORIES_BY_GROUP[g][0];
              setDraft(d => ({ ...d, group: g, category: cat, slot: CATEGORY_TO_SLOT[cat] }));
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GROUP_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Category</Label>
            <Select value={draft.category} onValueChange={v => setDraft(d => ({ ...d, category: v as ShopItem["category"], slot: CATEGORY_TO_SLOT[v] ?? d.slot }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES_BY_GROUP[draft.group].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Price (Chalk)</Label>
            <Input type="number" min={0} value={draft.price} onChange={e => setDraft(d => ({ ...d, price: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label className="text-xs">Chalk bonus %</Label>
            <Input type="number" min={0} value={draft.bonusPct} onChange={e => setDraft(d => ({ ...d, bonusPct: parseInt(e.target.value) || 0 }))} />
          </div>
          <div>
            <Label className="text-xs">Level requirement</Label>
            <Input
              type="number"
              min={1}
              max={10}
              placeholder="None"
              value={draft.levelReq ?? ""}
              onChange={e => {
                const v = e.target.value;
                setDraft(d => ({ ...d, levelReq: v === "" ? undefined : Math.max(1, parseInt(v) || 1) }));
              }}
            />
          </div>
          <div>
            <Label className="text-xs">Shop discount %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              placeholder="0"
              value={draft.discountPct ?? 0}
              onChange={e => setDraft(d => ({ ...d, discountPct: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
            />
            <p className="text-[10px] text-muted-foreground mt-1">Equipped item reduces shop prices. Discounts don't stack — best one wins.</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {editingId && <Button variant="ghost" onClick={reset}><X className="h-4 w-4" /> Cancel</Button>}
        <GameButton variant="primary" onClick={save} disabled={busy}>
          {editingId ? "Update item" : <><Plus className="h-4 w-4" /> Create item</>}
        </GameButton>
      </div>

      {/* Existing items list, grouped */}
      <div className="space-y-4 pt-2 border-t border-border">
        <div className="menu-label">All items ({all.length})</div>
        {GROUP_OPTIONS.map(group => {
          const inGroup = all.filter(i => i.group === group.value);
          if (inGroup.length === 0) return null;
          const byCategory = CATEGORIES_BY_GROUP[group.value]
            .map(cat => ({ cat, items: inGroup.filter(i => i.category === cat) }))
            .filter(b => b.items.length > 0);
          return (
            <div key={group.value} className="space-y-2">
              <div className="text-xs uppercase tracking-wider font-bold text-foreground">{group.label} ({inGroup.length})</div>
              {byCategory.map(({ cat, items }) => (
                <div key={cat} className="space-y-1.5">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground pl-1">{cat}</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {items.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-secondary/30">
                        <div className="h-10 w-10 grid place-items-center text-xl shrink-0">
                          {isImageEmoji(item.emoji) ? <img src={item.emoji} alt="" className="h-10 w-10 object-contain rounded" /> : item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground capitalize">
                            {item.rarity} · {item.price} chalk{item.bonus?.mult ? ` · +${Math.round(item.bonus.mult * 100)}%` : ""}{item.levelReq ? ` · Lv ${item.levelReq}+` : ""}
                          </div>
                        </div>
                        <button className="text-muted-foreground hover:text-foreground" onClick={() => startEdit(item)} title="Edit"><Pencil className="h-4 w-4" /></button>
                        <button className="text-destructive" onClick={async () => { if (confirm(`Delete ${item.name}?`)) { try { await deleteCustomItem(item.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message ?? "Delete failed"); } } }} title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </GameCard>
  );
}

function LevelsAdmin() {
  useLevelOverrides();
  const [editing, setEditing] = useState<number | null>(null);

  return (
    <GameCard tone="legendary" className="p-5 space-y-4">
      <div>
        <div className="menu-label">Levels</div>
        <p className="text-xs text-muted-foreground mt-1">Set the name, tagline and chalk requirement once — they apply to both genders. Upload a separate character image for male and female.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {LEVELS.map(base => {
          const r = resolvedLevel(base.level, "male");
          const rF = resolvedLevel(base.level, "female");
          const has = hasAnyOverride(base.level);
          const isEditing = editing === base.level;
          return (
            <div key={base.level} className={cn("rounded-lg border p-3", has ? "border-accent/40 bg-accent/5" : "border-border bg-secondary/20")}>
              <div className="flex items-start gap-3">
                <div className="flex gap-1 shrink-0">
                  <div className="h-12 w-12 grid place-items-center rounded bg-background/40 border border-border" title="Male">
                    {r.image ? <img src={r.image} alt="" className="h-12 w-12 object-contain" /> : <span className="text-muted-foreground text-[10px]">♂</span>}
                  </div>
                  <div className="h-12 w-12 grid place-items-center rounded bg-background/40 border border-border" title="Female">
                    {rF.image ? <img src={rF.image} alt="" className="h-12 w-12 object-contain" /> : <span className="text-muted-foreground text-[10px]">♀</span>}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Lv {base.level}{has ? "" : " · empty"}</div>
                  <div className="text-sm font-semibold truncate">{has ? r.title : <span className="text-muted-foreground italic">No name</span>}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{has ? r.desc : <span className="italic">No tagline</span>}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{r.cost.toLocaleString()} Chalk</div>
                </div>
                <button className="text-muted-foreground hover:text-foreground" onClick={() => setEditing(isEditing ? null : base.level)} title="Edit"><Pencil className="h-4 w-4" /></button>
              </div>
              {isEditing && <LevelEditor level={base.level} onDone={() => setEditing(null)} />}
            </div>
          );
        })}
      </div>
    </GameCard>
  );
}

function LevelEditor({ level, onDone }: { level: number; onDone: () => void; }) {
  const rM = resolvedLevel(level, "male");
  const rF = resolvedLevel(level, "female");
  const [name, setName] = useState<string>(rM.title === (LEVELS.find(l => l.level === level)?.title) && !hasAnyOverride(level) ? "" : rM.title);
  const [tagline, setTagline] = useState<string>(hasAnyOverride(level) ? rM.desc : "");
  const [chalkReq, setChalkReq] = useState<string>(hasAnyOverride(level) ? String(rM.cost) : "");
  const [rarity, setRarity] = useState<Rarity>((rM.rarity as Rarity) ?? "common");
  const [maleImageUrl, setMaleImageUrl] = useState<string | null>(rM.image ?? null);
  const [femaleImageUrl, setFemaleImageUrl] = useState<string | null>(rF.image ?? null);
  const [maleImageFile, setMaleImageFile] = useState<File | null>(null);
  const [femaleImageFile, setFemaleImageFile] = useState<File | null>(null);
  const [clearMale, setClearMale] = useState(false);
  const [clearFemale, setClearFemale] = useState(false);
  const [busy, setBusy] = useState(false);

  function pick(file: File, gender: Gender) {
    if (file.size > 20 * 1024 * 1024) { toast.error("Image too large (max 20 MB)"); return; }
    const url = URL.createObjectURL(file);
    if (gender === "male") { setMaleImageFile(file); setMaleImageUrl(url); setClearMale(false); }
    else { setFemaleImageFile(file); setFemaleImageUrl(url); setClearFemale(false); }
  }

  async function save() {
    setBusy(true);
    try {
      await saveLevel(level, {
        name: name.trim() || null,
        tagline: tagline.trim() || null,
        chalkReq: chalkReq === "" ? null : Math.max(0, parseInt(chalkReq) || 0),
        rarity,
        maleImageFile: maleImageFile ?? undefined,
        femaleImageFile: femaleImageFile ?? undefined,
        clearMaleImage: clearMale,
        clearFemaleImage: clearFemale,
      });
      toast.success("Level saved");
      onDone();
    } catch (e: any) { toast.error(e?.message ?? "Save failed"); }
    finally { setBusy(false); }
  }

  async function clearAll() {
    if (!confirm(`Clear Lv ${level} (both genders)?`)) return;
    setBusy(true);
    try { await clearLevel(level); toast.success("Cleared"); onDone(); }
    catch (e: any) { toast.error(e?.message ?? "Clear failed"); }
    finally { setBusy(false); }
  }

  const ImagePicker = ({ label, url, onPick, onClear }: { label: string; url: string | null; onPick: (f: File) => void; onClear: () => void }) => (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">{label}</div>
      <label className="flex flex-col items-center justify-center h-20 w-20 rounded-lg border-2 border-dashed border-[hsl(var(--panel-frame))] bg-secondary/40 cursor-pointer hover:border-[hsl(var(--btn-orange))] overflow-hidden">
        {url
          ? <img src={url} alt="" className="h-full w-full object-contain" />
          : <div className="text-center text-muted-foreground text-[10px]"><Upload className="h-4 w-4 mx-auto mb-0.5" />Image</div>}
        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); }} />
      </label>
      {url && <button className="text-[10px] text-muted-foreground hover:text-destructive block mx-auto" onClick={onClear}>Remove</button>}
    </div>
  );

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      <div className="grid gap-2 grid-cols-[auto,1fr]">
        <div className="flex gap-2">
          <ImagePicker label="Male" url={maleImageUrl} onPick={f => pick(f, "male")} onClear={() => { setMaleImageUrl(null); setMaleImageFile(null); setClearMale(true); }} />
          <ImagePicker label="Female" url={femaleImageUrl} onPick={f => pick(f, "female")} onClear={() => { setFemaleImageUrl(null); setFemaleImageFile(null); setClearFemale(true); }} />
        </div>
        <div className="grid gap-2">
          <Input placeholder="Name (shared)" value={name} onChange={e => setName(e.target.value)} />
          <Input placeholder="Tagline (shared)" value={tagline} onChange={e => setTagline(e.target.value)} />
          <Input type="number" min={0} placeholder="Chalk requirement (shared)" value={chalkReq} onChange={e => setChalkReq(e.target.value)} />
          <Select value={rarity} onValueChange={v => setRarity(v as Rarity)}>
            <SelectTrigger><SelectValue placeholder="Rarity" /></SelectTrigger>
            <SelectContent>
              {RARITIES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-between gap-2">
        <Button variant="ghost" size="sm" className="text-destructive" onClick={clearAll} disabled={busy}><Trash2 className="h-4 w-4" /> Clear all</Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onDone}><X className="h-4 w-4" /> Cancel</Button>
          <GameButton variant="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</GameButton>
        </div>
      </div>
    </div>
  );
}

function PublicGymsAdmin() {
  const s = usePublicGyms();
  const [name, setName] = useState("");
  const [loc, setLoc] = useState("");
  const [country, setCountry] = useState<string>("");

  return (
    <GameCard tone="accent" className="p-5 space-y-4">
      <div>
        <div className="menu-label mb-1">Admin · Public Gyms</div>
        <p className="text-xs text-muted-foreground">
          Gyms created here are visible to all users and can be added to their own list. Hold colors and grading systems edited here apply for everyone.
        </p>
      </div>

      <div className="grid sm:grid-cols-[1fr,1fr,1fr,auto] gap-2">
        <Input placeholder="Gym name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Location (city)" value={loc} onChange={e => setLoc(e.target.value)} />
        <Select value={country || undefined} onValueChange={setCountry}>
          <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <GameButton variant="primary" onClick={async () => {
          if (!name.trim()) { toast.error("Name required"); return; }
          try {
            await addPublicGym(name.trim(), loc.trim(), country || undefined);
            setName(""); setLoc(""); setCountry("");
            toast.success("Public gym added");
          } catch (e: any) { toast.error(e?.message ?? "Failed"); }
        }}><Plus className="h-4 w-4" /> Add</GameButton>
      </div>

      {s.gyms.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No public gyms yet.</p>
      )}

      <div className="space-y-3">
        {s.gyms.map(g => (
          <PublicGymEditor key={g.id} gym={g} />
        ))}
      </div>
    </GameCard>
  );
}

function PublicGymEditor({ gym }: { gym: any }) {
  return (
    <div className="p-4 rounded-md border border-border bg-secondary/30 space-y-4">
      <div className="grid sm:grid-cols-[1fr,1fr,1fr,auto] gap-2 items-center">
        <Input value={gym.name} onChange={e => updatePublicGym(gym.id, { name: e.target.value })} />
        <Input value={gym.location} onChange={e => updatePublicGym(gym.id, { location: e.target.value })} placeholder="Location" />
        <Select value={gym.country ?? undefined} onValueChange={v => updatePublicGym(gym.id, { country: v })}>
          <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={async () => {
          if (!confirm(`Delete public gym "${gym.name}"? This affects all users.`)) return;
          try { await deletePublicGym(gym.id); toast.success("Deleted"); }
          catch (e: any) { toast.error(e?.message ?? "Failed"); }
        }}><Trash2 className="h-4 w-4" /></Button>
      </div>

      <section>
        <div className="menu-label mb-2">Hold colors</div>
        <div className="flex flex-wrap gap-2">
          {(gym.holdColors ?? []).map((c: any) => (
            <div key={c.id} className="flex items-center gap-2 px-2 py-1 rounded-md border border-border bg-background/50">
              <HoldSwatch hex={c.hex} hex2={c.hex2} className="h-5 w-5" />
              <span className="text-xs">{c.name}</span>
              <button onClick={() => removePublicHoldColor(gym.id, c.id)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <AddHoldColor onAdd={(c) => addPublicHoldColor(gym.id, c)} />
        </div>
      </section>

      <GymGradingEditor
        gym={gym}
        source="public"
        onSelectSystem={(gsId) => updatePublicGym(gym.id, { gradingSystemIds: [gsId] }).catch((e: any) => toast.error(e?.message ?? "Failed"))}
        onAddCustom={async (gs) => {
          try {
            const id = await addPublicGymCustomGrading(gym.id, gs);
            if (id) await updatePublicGym(gym.id, { gradingSystemIds: [id] });
          } catch (e: any) { toast.error(e?.message ?? "Failed"); }
        }}
        onUpdateCustom={(gsId, patch) => updatePublicGymCustomGrading(gym.id, gsId, patch).catch((e: any) => toast.error(e?.message ?? "Failed"))}
        onDeleteCustom={(gsId) => deletePublicGymCustomGrading(gym.id, gsId).catch((e: any) => toast.error(e?.message ?? "Failed"))}
      />
    </div>
  );
}


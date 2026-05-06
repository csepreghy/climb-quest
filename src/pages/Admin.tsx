import { useState } from "react";
import { ThemeStudio } from "@/components/ThemeStudio";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminAdjustChalk, useGame } from "@/game/store";
import { toast } from "sonner";
import { Plus, Minus, Upload, Trash2, Pencil, X } from "lucide-react";
import {
  useAllItems,
  useCustomItems,
  useHiddenBuiltins,
  addCustomItem,
  updateCustomItem,
  deleteCustomItem,
  hideBuiltinItem,
  restoreBuiltinItem,
  isImageEmoji,
  CustomItemInput,
} from "@/game/customItems";
import { ItemGroup, Rarity, Slot, ShopItem, ITEM_BY_ID } from "@/game/data";
import { cn } from "@/lib/utils";

const RARITIES: Rarity[] = ["common", "rare", "epic", "legendary", "consumable"];
const GROUP_OPTIONS: { value: ItemGroup; label: string }[] = [
  { value: "outfit", label: "Outfit" },
  { value: "gear", label: "Gear" },
  { value: "power", label: "Power-ups" },
];
const CATEGORIES_BY_GROUP: Record<ItemGroup, ShopItem["category"][]> = {
  outfit: ["Top", "Bottom", "Shoes", "Hat", "Hand"],
  gear: ["Brushes", "Chalk"],
  power: ["Accessories", "Auras", "Titles", "Consumables"],
};
const CATEGORY_TO_SLOT: Record<string, Slot> = {
  Top: "outfit", Bottom: "bottoms", Shoes: "shoes", Hat: "hat", Hand: "hand",
  Brushes: "accessory", Chalk: "chalk",
  Accessories: "accessory", Auras: "aura", Titles: "title", Consumables: "accessory",
};

export default function Admin() {
  const s = useGame();
  const [amount, setAmount] = useState(100);
  return (
    <div className="space-y-6 animate-float-up max-w-5xl">
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

      <InventoryAdmin />

      <div className="rpg-panel p-5" style={{ background: "hsl(var(--panel-fill))" }}>
        <ThemeStudio />
      </div>
    </div>
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
};

function InventoryAdmin() {
  const all = useAllItems();
  const [draft, setDraft] = useState<CustomItemInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() { setDraft(empty); setEditingId(null); }

  async function pickImage(file: File) {
    if (file.size > 2 * 1024 * 1024) { toast.error("Image too large (max 2 MB)"); return; }
    const reader = new FileReader();
    reader.onload = () => setDraft(d => ({ ...d, imageDataUrl: reader.result as string }));
    reader.readAsDataURL(file);
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
                            {item.rarity} · {item.price} chalk{item.bonus?.mult ? ` · +${Math.round(item.bonus.mult * 100)}%` : ""}
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

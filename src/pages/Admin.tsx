import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ThemeStudio } from "@/components/ThemeStudio";
import { GameCard } from "@/components/ui/game-card";
import { GameButton } from "@/components/ui/game-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminAdjustChalk, adminSetLevel, adminSetIgnoreLevelReq, adminSeedMockData, resetGame, resetOnboarding, resetStrengthLevels, adminTriggerStreakReward, useGame } from "@/game/store";
import { useAuth } from "@/hooks/useAuth";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import chalkBagImg from "@/assets/chalk-bag.png";
import { Plus, Minus, Upload, Trash2, Pencil, Copy, X, User as UserIcon, Users as UsersIcon, Shield, Settings, Layers, Package, MapPin, Palette, MessageSquare, Archive, Bell, Sparkles } from "lucide-react";
import { AdminNotificationsPanel } from "@/components/notifications/AdminNotificationsPanel";
import { SnapshotsAdmin } from "@/components/admin/SnapshotsAdmin";
import { CardLab } from "@/components/admin/CardLab";
import { TopoLab } from "@/components/admin/TopoLab";
import { supabase } from "@/integrations/supabase/client";
import {
  useAllItems,
  addCustomItem,
  updateCustomItem,
  deleteCustomItem,
  isImageEmoji,
  backfillShopImages,
  CustomItemInput,
} from "@/game/customItems";
import { ItemGroup, Rarity, Slot, ShopItem, LEVELS, Gender, effectAllowed } from "@/game/data";
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
import { useDailyCapConfig, setDailyCapConfig, computeDailyCap, defaultDailyCap, DailyCapConfig, useDailyCapOverrides, setDailyCapOverride } from "@/game/dailyCap";
import { useActivityRewards, setActivityRewards } from "@/game/activityRewards";
import { Dumbbell } from "lucide-react";


const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
const GROUP_OPTIONS: { value: ItemGroup; label: string }[] = [
  { value: "outfit", label: "Outfit" },
  { value: "gear", label: "Gear" },
  { value: "power", label: "Power-ups" },
  { value: "buddy", label: "Climbing Buddies" },
];
const CATEGORIES_BY_GROUP: Record<ItemGroup, ShopItem["category"][]> = {
  outfit: ["Top", "Pants", "Shoes", "Hat", "Hand"],
  gear: ["Brushes", "Chalk", "Study"],
  power: ["Power-up"],
  buddy: ["Buddy"],
};
const CATEGORY_TO_SLOT: Record<string, Slot> = {
  Top: "outfit", Pants: "bottoms", Shoes: "shoes", Hat: "hat", Hand: "hand",
  Brushes: "accessory", Chalk: "chalk", Study: "study",
  "Power-up": "powerup",
  Buddy: "buddy",
  Accessories: "powerup", Auras: "powerup", Titles: "powerup", Consumables: "powerup",
};

export default function Admin() {
  const s = useGame();
  const { user } = useAuth();
  const [amount, setAmount] = useState(100);
  return (
    <div className="space-y-6 animate-float-up max-w-5xl">
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
            <p className="text-xs text-muted-foreground">Manage game data, users, and presentation.</p>
          </div>
        </div>
        <a href="/admin/hangboard-calibration">
          <GameButton variant="ghost" size="sm">
            <Dumbbell className="h-4 w-4" /> Hangboard calibration
          </GameButton>
        </a>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid grid-cols-3 sm:grid-cols-10 gap-1 h-auto p-1 w-full bg-secondary/40 border-2 border-[hsl(var(--panel-frame))] rounded-lg">
          {[
            { value: "general", label: "General", Icon: Settings },
            { value: "users", label: "Users", Icon: UsersIcon },
            { value: "levels", label: "Levels", Icon: Layers },
            { value: "items", label: "Items", Icon: Package },
            { value: "gyms", label: "Gyms", Icon: MapPin },
            { value: "theme", label: "Theme", Icon: Palette },
            { value: "card-lab", label: "Card Lab", Icon: Sparkles },
            { value: "notify", label: "Notify", Icon: Bell },
            { value: "feedback", label: "Feedback", Icon: MessageSquare },
            { value: "snapshots", label: "Snapshots", Icon: Archive },
          ].map(({ value, label, Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 px-2 py-2 text-[11px] sm:text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <GameCard tone="legendary" className="p-5">
            <div className="menu-label mb-3">Admin · Onboarding</div>
            <p className="text-sm text-muted-foreground mb-3">
              Reset the first-time onboarding flow on this account so you can watch it again.
            </p>
            <Button variant="secondary" onClick={() => { resetOnboarding(); toast.success("Onboarding reset — reload to see it"); }}>
              Replay onboarding
            </Button>
          </GameCard>

          <GameCard tone="accent" className="p-5">
            <div className="menu-label mb-3">Admin · Mock Data</div>
            <p className="text-sm text-muted-foreground mb-3">Add sample boulder logs and bosses for testing UI states.</p>
            <Button onClick={() => { adminSeedMockData(); toast.success("Mock data added"); }}>
              <Plus className="h-4 w-4" /> Seed mock boulders & bosses
            </Button>
          </GameCard>

          <BackfillImagesCard />
          <RebalanceCard />
          <DailyCapCard />
          <StrengthRewardsCard />

          <GameCard tone="accent" className="p-5">
            <div className="menu-label mb-3">Admin · Trigger Streak Milestone</div>
            <p className="text-sm text-muted-foreground mb-3">
              Instantly fire any streak reward for yourself (banner + buffs + chalk cache where applicable). Useful for testing celebratory flows.
            </p>
            <div className="flex flex-wrap gap-2">
              {[7, 14, 21, 28, 30].map(day => (
                <Button
                  key={day}
                  variant={day === 7 ? "secondary" : "default"}
                  onClick={() => {
                    const r = adminTriggerStreakReward(day);
                    toast.success(<div className="flex items-center gap-1.5">{r.bannerLabel}{r.chalkCache > 0 ? <><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />(+{r.chalkCache} Chalk)</> : ""}</div>);
                  }}
                >
                  Day {day}
                </Button>
              ))}
            </div>
          </GameCard>


          <GameCard tone="legendary" className="p-5">
            <div className="menu-label mb-3">Admin · Reset This Account</div>
            <p className="text-sm text-muted-foreground mb-3">
              Wipe all chalk, logs, levels, inventory, and bosses on your account. Cannot be undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive"><Trash2 className="h-4 w-4" /> Reset account to 0</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This clears chalk, logs, level, inventory, and bosses. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => { resetGame(); toast.success("Account reset"); }}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </GameCard>

          <GameCard tone="legendary" className="p-5">
            <div className="menu-label mb-3">Admin · Chalk Controls</div>
            <div className="text-sm text-muted-foreground mb-3">Current balance: <span className="gradient-chalk-text font-bold tabular-nums">{s.chalk.toLocaleString()}</span></div>
            <div className="flex gap-2">
              <Input type="number" value={amount} min={1} onChange={e => setAmount(parseInt(e.target.value) || 0)} className="max-w-32" />
              <Button variant="default" onClick={() => { adminAdjustChalk(amount); toast.success(<div className="flex items-center gap-1.5"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />+{amount} Chalk</div>); }}>
                <Plus className="h-4 w-4" /> Add
              </Button>
              <Button variant="secondary" onClick={() => { adminAdjustChalk(-amount); toast.info(<div className="flex items-center gap-1.5"><img src={chalkBagImg} alt="" className="h-4 w-4 object-contain" />-{amount} Chalk</div>); }}>
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
        </TabsContent>

        <TabsContent value="users" className="space-y-6 mt-6">
          <UsersAdmin />
        </TabsContent>

        <TabsContent value="levels" className="space-y-6 mt-6">
          <LevelsAdmin />
        </TabsContent>


        <TabsContent value="items" className="space-y-6 mt-6">
          <InventoryAdmin />
        </TabsContent>

        <TabsContent value="gyms" className="space-y-6 mt-6">
          <PublicGymsAdmin />
        </TabsContent>

        <TabsContent value="theme" className="mt-6">
          <div className="rpg-panel p-5" style={{ background: "hsl(var(--panel-fill))" }}>
            <ThemeStudio />
          </div>
        </TabsContent>

        <TabsContent value="card-lab" className="mt-6">
          <CardLab />
        </TabsContent>

        <TabsContent value="notify" className="space-y-6 mt-6">
          <AdminNotificationsPanel />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6 mt-6">
          <FeedbackAdmin />
        </TabsContent>

        <TabsContent value="snapshots" className="space-y-6 mt-6">
          <SnapshotsAdmin />
        </TabsContent>
      </Tabs>
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
        Convert legacy base64 item images to 360px webp in cloud storage. One-off operation; safe to re-run.
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

function StrengthRewardsCard() {
  const rewards = useActivityRewards();
  const [perRep, setPerRep] = useState<string>("");
  const [bossBonus, setBossBonus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const curRep = rewards.strength_rep ?? 5;
  const curBoss = rewards.strength_boss_send ?? 300;
  const draftRep = perRep === "" ? curRep : Math.max(0, Math.round(Number(perRep) || 0));
  const draftBoss = bossBonus === "" ? curBoss : Math.max(0, Math.round(Number(bossBonus) || 0));
  const dirty = draftRep !== curRep || draftBoss !== curBoss;

  async function save() {
    setBusy(true);
    try {
      await setActivityRewards({ strength_rep: draftRep, strength_boss_send: draftBoss });
      toast.success("Strength rewards saved");
      setPerRep(""); setBossBonus("");
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally { setBusy(false); }
  }

  return (
    <GameCard tone="accent" className="p-5">
      <div className="menu-label mb-3 flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Admin · Strength rewards</div>
      <p className="text-sm text-muted-foreground mb-3">
        Top-tier per-rep chalk (when logging at your max-unlocked level). One level below pays 60%, two below 40%, three+ below 20%. Boss bonus is added when a strength boss is defeated.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Chalk per rep</Label>
          <Input
            type="number" min={0}
            value={perRep === "" ? curRep : perRep}
            onChange={e => setPerRep(e.target.value)}
            className="mt-1"
          />
          <div className="text-xs text-muted-foreground mt-1">Example at max level, 10 reps: <span className="font-bold text-foreground">+{10 * draftRep}</span> chalk.</div>
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Strength boss bonus</Label>
          <Input
            type="number" min={0}
            value={bossBonus === "" ? curBoss : bossBonus}
            onChange={e => setBossBonus(e.target.value)}
            className="mt-1"
          />
          <div className="text-xs text-muted-foreground mt-1">Added on top of per-rep chalk when the boss is defeated.</div>
        </div>
      </div>
      <div className="mt-4 flex gap-2 flex-wrap">
        <Button onClick={save} disabled={!dirty || busy}>{busy ? "Saving…" : "Save"}</Button>
        {dirty && <Button variant="ghost" onClick={() => { setPerRep(""); setBossBonus(""); }}>Reset</Button>}
      </div>
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">First-time strength selection</div>
        <p className="text-xs text-muted-foreground mb-2">
          Clears your unlocked strength levels so the first-time level picker shows again next time you log a strength session.
        </p>
        <Button
          variant="secondary"
          onClick={() => { resetStrengthLevels(); toast.success("First-time strength selection reset"); }}
        >
          <Trash2 className="h-4 w-4" /> Reset first-time strength picker
        </Button>
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

function DailyCapCard() {
  const cfg = useDailyCapConfig();
  const overrides = useDailyCapOverrides();
  const [draft, setDraft] = useState<DailyCapConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const [overrideDrafts, setOverrideDrafts] = useState<Record<number, string>>({});
  const d = draft ?? cfg;
  const dirty = JSON.stringify(d) !== JSON.stringify(cfg);

  const sortedLevels = [...LEVELS].sort((a, b) => a.level - b.level).slice(0, 10);

  function update<K extends keyof DailyCapConfig>(k: K, v: DailyCapConfig[K]) {
    setDraft(prev => ({ ...(prev ?? cfg), [k]: v }));
  }
  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      await setDailyCapConfig(draft);
      toast.success("Daily cap saved");
      setDraft(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally { setBusy(false); }
  }

  async function saveOverride(level: number) {
    const raw = overrideDrafts[level];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    setBusy(true);
    try {
      if (trimmed === "") {
        await setDailyCapOverride(level, null);
        toast.success(`Lv${level} override cleared`);
      } else {
        const num = Number(trimmed);
        if (!Number.isFinite(num) || num < 0) throw new Error("Cap must be a positive number");
        await setDailyCapOverride(level, num);
        toast.success(`Lv${level} cap saved`);
      }
      setOverrideDrafts(prev => { const n = { ...prev }; delete n[level]; return n; });
    } catch (e: any) {
      toast.error(e?.message ?? "Save failed");
    } finally { setBusy(false); }
  }

  return (
    <GameCard tone="legendary" className="p-5">
      <div className="menu-label mb-3">Admin · Daily chalk cap</div>
      <p className="text-sm text-muted-foreground mb-3">
        Soft cap on chalk per day. Past the cap, chalk earns at reduced rates. Default cap = base + (next-level cost × %), so it grows exponentially with progression. You can override the cap for any level below.
      </p>
      <div className="flex items-center gap-2 mb-4">
        <input
          id="daily-cap-enabled"
          type="checkbox"
          className="h-4 w-4 accent-[hsl(var(--btn-orange))]"
          checked={d.enabled}
          onChange={e => update("enabled", e.target.checked)}
        />
        <Label htmlFor="daily-cap-enabled" className="cursor-pointer">Enabled</Label>
      </div>
      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", !d.enabled && "opacity-60")}>
        <div>
          <Label className="text-xs">Base</Label>
          <Input type="number" value={d.base} onChange={e => update("base", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Next-level cost %</Label>
          <Input type="number" value={d.levelStep} onChange={e => update("levelStep", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Tier 1 threshold (×cap)</Label>
          <Input type="number" step="0.1" value={d.tier1Threshold} onChange={e => update("tier1Threshold", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Tier 1 multiplier</Label>
          <Input type="number" step="0.05" value={d.tier1Mult} onChange={e => update("tier1Mult", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Tier 2 threshold (×cap)</Label>
          <Input type="number" step="0.1" value={d.tier2Threshold} onChange={e => update("tier2Threshold", Number(e.target.value))} />
        </div>
        <div>
          <Label className="text-xs">Tier 2 multiplier</Label>
          <Input type="number" step="0.05" value={d.tier2Mult} onChange={e => update("tier2Mult", Number(e.target.value))} />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" disabled={!dirty || busy} onClick={() => setDraft(null)}>Reset</Button>
        <Button disabled={!dirty || busy} onClick={save}>{busy ? "Saving…" : "Save"}</Button>
      </div>

      <div className="mt-6">
        <div className="menu-label mb-2">Per-level caps</div>
        <p className="text-xs text-muted-foreground mb-3">
          Leave blank to use the formula default. Enter a number to override that level's cap.
        </p>
        <div className="rounded-lg border border-border divide-y divide-border/60 overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_120px_160px_90px] items-center px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground bg-secondary/40">
            <span>Level</span>
            <span>Title</span>
            <span className="text-right">Default cap</span>
            <span className="text-right">Override</span>
            <span></span>
          </div>
          {sortedLevels.map(lv => {
            const def = defaultDailyCap(lv.level, d);
            const ov = overrides[lv.level];
            const draftVal = overrideDrafts[lv.level];
            const currentVal = draftVal !== undefined ? draftVal : (ov !== undefined ? String(ov) : "");
            const rowDirty = draftVal !== undefined && draftVal !== (ov !== undefined ? String(ov) : "");
            const effective = computeDailyCap(lv.level, d, overrides);
            return (
              <div key={lv.level} className="grid grid-cols-[60px_1fr_120px_160px_90px] items-center px-3 py-2 text-sm gap-2">
                <span className="font-bold tabular-nums">Lv{lv.level}</span>
                <span className="truncate text-foreground/90">{lv.title}</span>
                <span className="text-right tabular-nums text-muted-foreground">{def.toLocaleString()}</span>
                <Input
                  type="number"
                  placeholder={`${def.toLocaleString()}`}
                  value={currentVal}
                  onChange={e => setOverrideDrafts(prev => ({ ...prev, [lv.level]: e.target.value }))}
                  className="h-8 text-right tabular-nums"
                />
                <div className="flex items-center justify-end gap-1">
                  {ov !== undefined && (
                    <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--btn-orange))]" title={`Effective: ${effective.toLocaleString()}`}>
                      Set
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    disabled={!rowDirty || busy}
                    onClick={() => saveOverride(lv.level)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
  critChancePct: 0,
  bossBonusPct: 0,
};

function InventoryAdmin() {
  const all = useAllItems();
  const [draft, setDraft] = useState<CustomItemInput>(empty);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeKey, setActiveKey] = useState<{ group: ItemGroup; category: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const topFormRef = useRef<HTMLDivElement | null>(null);
  const inlineFormRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  function reset() { setDraft(empty); setEditingId(null); setActiveKey(null); }

  async function pickImage(file: File) {
    if (file.size > 20 * 1024 * 1024) { toast.error("Image too large (max 20 MB)"); return; }
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

  function draftFromItem(item: ShopItem): CustomItemInput {
    return {
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
      critChancePct: item.critChancePct ?? 0,
      bossBonusPct: item.bossBonusPct ?? 0,
      gender: item.gender ?? "unisex",
    };
  }

  function scrollToInline() {
    requestAnimationFrame(() => {
      inlineFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => nameInputRef.current?.focus({ preventScroll: true }), 350);
    });
  }

  function startEdit(item: ShopItem) {
    setEditingId(item.id);
    setActiveKey({ group: item.group, category: item.category });
    setDraft(draftFromItem(item));
    scrollToInline();
  }

  function startCopy(item: ShopItem) {
    setEditingId(null);
    setActiveKey({ group: item.group, category: item.category });
    setDraft({ ...draftFromItem(item), name: `${item.name} (copy)` });
    scrollToInline();
  }

  function renderForm(refTarget: React.MutableRefObject<HTMLDivElement | null>) {
    return (
      <div className="space-y-5">
        <div ref={refTarget} className="scroll-mt-4">
          <div className="menu-label">{editingId ? "Editing item" : activeKey ? "Copying item" : "Inventory items"}</div>
          <p className="text-xs text-muted-foreground mt-1">Create custom shop items, upload an image, set rarity, price and chalk bonus.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-[120px,1fr]">
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
              <Input ref={nameInputRef} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Send Slippers" />
            </div>
            <div>
              <Label className="text-xs">Rarity</Label>
              <Select value={draft.rarity} onValueChange={v => {
                const r = v as Rarity;
                setDraft(d => ({
                  ...d,
                  rarity: r,
                  bonusPct: effectAllowed(d.group, r, "chalk") ? d.bonusPct : 0,
                  discountPct: effectAllowed(d.group, r, "discount") ? d.discountPct : 0,
                }));
              }}>
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
                setDraft(d => {
                  const baseBonus = g === "buddy" && (!d.bonusPct || d.group !== "buddy") ? 50 : d.bonusPct;
                  return {
                    ...d,
                    group: g,
                    category: cat,
                    slot: CATEGORY_TO_SLOT[cat],
                    bonusPct: effectAllowed(g, d.rarity, "chalk") ? baseBonus : 0,
                    discountPct: effectAllowed(g, d.rarity, "discount") ? d.discountPct : 0,
                  };
                });
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GROUP_OPTIONS.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {draft.group !== "power" && (
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={draft.category} onValueChange={v => setDraft(d => ({ ...d, category: v as ShopItem["category"], slot: CATEGORY_TO_SLOT[v] ?? d.slot }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES_BY_GROUP[draft.group].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {(draft.category === "Top" || draft.category === "Pants") && (
              <div>
                <Label className="text-xs">Gender</Label>
                <Select value={draft.gender ?? "unisex"} onValueChange={v => setDraft(d => ({ ...d, gender: v as "male" | "female" | "unisex" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unisex">Unisex (everyone)</SelectItem>
                    <SelectItem value="male">Male only</SelectItem>
                    <SelectItem value="female">Female only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Price (Chalk)</Label>
              <Input type="number" min={0} value={draft.price} onChange={e => setDraft(d => ({ ...d, price: parseInt(e.target.value) || 0 }))} />
            </div>
            {effectAllowed(draft.group, draft.rarity, "chalk") && (
              <div>
                <Label className="text-xs">Chalk bonus %</Label>
                <Input type="number" min={0} value={draft.bonusPct} onChange={e => setDraft(d => ({ ...d, bonusPct: parseInt(e.target.value) || 0 }))} />
              </div>
            )}
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
            {effectAllowed(draft.group, draft.rarity, "discount") && (
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
            )}
            <div>
              <Label className="text-xs">Crit chance %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={draft.critChancePct ?? 0}
                onChange={e => setDraft(d => ({ ...d, critChancePct: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) }))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Chance every log's chalk doubles. Stacks across equipped items.</p>
            </div>
            <div>
              <Label className="text-xs">Boss bonus %</Label>
              <Input
                type="number"
                min={0}
                value={draft.bossBonusPct ?? 0}
                onChange={e => setDraft(d => ({ ...d, bossBonusPct: Math.max(0, parseInt(e.target.value) || 0) }))}
              />
              <p className="text-[10px] text-muted-foreground mt-1">Extra % chalk on boss attempts and sends. Sums across equipped items.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {(editingId || activeKey) && <Button variant="ghost" onClick={reset}><X className="h-4 w-4" /> Cancel</Button>}
          <GameButton variant="primary" onClick={save} disabled={busy}>
            {editingId ? "Update item" : <><Plus className="h-4 w-4" /> Create item</>}
          </GameButton>
        </div>
      </div>
    );
  }

  return (
    <GameCard tone="accent" className="p-5 space-y-5">
      {!activeKey && renderForm(topFormRef)}

      <div className={cn("space-y-4", !activeKey && "pt-2 border-t border-border")}>
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
              {byCategory.map(({ cat, items }) => {
                const showFormHere = activeKey?.group === group.value && activeKey?.category === cat;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground pl-1">{cat}</div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map(item => {
                        const isBuddy = item.group === "buddy";
                        const thumb = isBuddy ? "h-20 w-20" : "h-10 w-10";
                        return (
                        <div key={item.id} className={cn("flex items-center gap-3 p-2 rounded-lg border bg-secondary/30", editingId === item.id ? "border-[hsl(var(--btn-orange))]" : "border-border")}>
                          <div className={cn("grid place-items-center text-xl shrink-0", thumb)}>
                            {isImageEmoji(item.emoji) ? <img src={item.emoji} alt="" className={cn("object-contain rounded", thumb)} /> : item.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">{item.name}</div>
                            <div className="text-[10px] text-muted-foreground capitalize">
                              {item.rarity} · {item.price} chalk{item.bonus?.mult ? ` · +${Math.round(item.bonus.mult * 100)}%` : ""}{item.levelReq ? ` · Lv ${item.levelReq}+` : ""}{(item.category === "Top" || item.category === "Pants") ? ` · ${item.gender ?? "unisex"}` : ""}
                            </div>
                          </div>
                          <button className="text-muted-foreground hover:text-foreground" onClick={() => startEdit(item)} title="Edit"><Pencil className="h-4 w-4" /></button>
                          <button className="text-muted-foreground hover:text-foreground" onClick={() => startCopy(item)} title="Copy"><Copy className="h-4 w-4" /></button>
                          <button className="text-destructive" onClick={async () => { if (confirm(`Delete ${item.name}?`)) { try { await deleteCustomItem(item.id); toast.success("Deleted"); } catch (e: any) { toast.error(e?.message ?? "Delete failed"); } } }} title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        );
                      })}
                    </div>
                    {showFormHere && (
                      <div className="mt-3 p-3 rounded-lg border-2 border-[hsl(var(--btn-orange))] bg-background/40">
                        {renderForm(inlineFormRef)}
                      </div>
                    )}
                  </div>
                );
              })}
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

interface AdminUserRow {
  user_id: string;
  email: string | null;
  character_name: string | null;
  display_name: string | null;
  is_admin: boolean;
  level: number;
  total_chalk_earned: number;
  total_logs: number;
  bosses_sent: number;
  created_at: string;
  provider: string | null;
  archived_at: string | null;
}


function providerLabel(p: string | null | undefined): string {
  switch ((p ?? "email").toLowerCase()) {
    case "google": return "Google";
    case "apple": return "Apple";
    case "email": return "Email";
    default: return (p ?? "Email").replace(/^./, c => c.toUpperCase());
  }
}

function UsersAdmin() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase.rpc("get_admin_users");
    if (error) setError(error.message);
    else setRows((data ?? []) as any);
  }
  useEffect(() => { load(); }, []);


  async function toggleArchive(row: AdminUserRow) {
    const archive = !row.archived_at;
    const { error } = await (supabase.rpc as any)("set_user_archived", {
      target_user: row.user_id,
      archived: archive,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(archive ? `Archived ${row.character_name ?? row.email ?? "user"}` : `Restored ${row.character_name ?? row.email ?? "user"}`);
    setRows(prev => prev?.map(r => r.user_id === row.user_id ? { ...r, archived_at: archive ? new Date().toISOString() : null } : r) ?? null);
  }


  return (
    <GameCard tone="legendary" className="p-5">
      <div className="menu-label mb-3 flex items-center gap-2"><UsersIcon className="h-4 w-4" /> Registered users {rows && `(${rows.length})`}</div>
      {error && <div className="text-sm text-destructive mb-2">{error}</div>}
      {!rows && !error && <div className="text-sm text-muted-foreground">Loading…</div>}
      {rows && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-2">Climber</th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Sign-up</th>
                <th className="text-right py-2 px-2">Lv</th>
                <th className="text-right py-2 px-2">All-time chalk</th>
                <th className="text-right py-2 px-2">Logs</th>
                <th className="text-right py-2 px-2">Bosses</th>
                <th className="text-left py-2 px-2">Joined</th>
                <th className="text-right py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.user_id} className={cn("border-b border-border/40 hover:bg-secondary/30", r.archived_at && "opacity-60")}>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.character_name ?? <span className="italic text-muted-foreground">unnamed</span>}</span>
                      {r.is_admin && <span title="Admin"><Shield className="h-3.5 w-3.5 text-legendary" /></span>}
                      {r.archived_at && (
                        <span
                          title={`Archived ${new Date(r.archived_at).toLocaleString()} — hidden from leaderboard`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] uppercase tracking-wider font-bold text-muted-foreground border border-border"
                        >
                          <Archive className="h-3 w-3" /> Archived
                        </span>
                      )}
                    </div>
                    {r.display_name && r.display_name !== r.character_name && (
                      <div className="text-[11px] text-muted-foreground">{r.display_name}</div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{r.email}</td>
                  <td className="py-2 px-2">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-secondary/60 border border-border text-[11px] font-semibold">
                      {providerLabel(r.provider)}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">{r.level}</td>
                  <td className="py-2 px-2 text-right tabular-nums gradient-chalk-text font-bold">{r.total_chalk_earned.toLocaleString()}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{r.total_logs}</td>
                  <td className="py-2 px-2 text-right tabular-nums">{r.bosses_sent}</td>
                  <td className="py-2 px-2 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-2 text-right">
                    {r.user_id !== user?.id && (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title={r.archived_at ? "Restore user (show on leaderboard)" : "Archive user (hide from leaderboard)"}
                          onClick={() => toggleArchive(r)}
                        >
                          <Archive className={cn("h-4 w-4", r.archived_at ? "text-legendary" : "text-muted-foreground")} />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>

              ))}
            </tbody>
          </table>
        </div>
      )}

    </GameCard>
  );
}

function FeedbackAdmin() {
  const [rows, setRows] = useState<Array<{
    id: string; user_id: string; email: string | null; character_name: string | null;
    category: string; message: string; created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_all_feedback");
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setRows((data ?? []) as any);
  }
  useEffect(() => { load(); }, []);

  const categories = Array.from(new Set(rows.map(r => r.category))).sort();
  const filtered = filter === "all" ? rows : rows.filter(r => r.category === filter);

  async function remove(id: string) {
    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    setRows(prev => prev.filter(r => r.id !== id));
  }

  return (
    <GameCard tone="legendary" className="p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="menu-label">Admin · User Feedback</div>
          <p className="text-sm text-muted-foreground mt-1">{rows.length} total submission{rows.length === 1 ? "" : "s"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="secondary" onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
        </div>
      </div>
      {loading && rows.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading feedback…</div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">No feedback yet.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className="rounded-lg border-2 border-[hsl(var(--panel-frame))] bg-secondary/30 p-3">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--btn-orange))] text-white font-semibold">{r.category}</span>
                  <span className="font-semibold text-foreground">{r.character_name ?? "Unnamed"}</span>
                  {r.email && <span className="text-muted-foreground">· {r.email}</span>}
                  <span className="text-muted-foreground">· {new Date(r.created_at).toLocaleString()}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(r.id)} title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap text-foreground/90">{r.message}</p>
            </div>
          ))}
        </div>
      )}
    </GameCard>
  );
}

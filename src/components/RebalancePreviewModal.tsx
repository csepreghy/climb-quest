import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAllItems, updateCustomItem } from "@/game/customItems";
import { useActivityRewards, setActivityRewards } from "@/game/activityRewards";
import { proposeRebalance, ItemDiff, ActivityDiff, ENDGAME_CEILING } from "@/game/rebalance";
import { ACTIVITY_LABELS, ActivityType } from "@/game/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RebalancePreviewModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useAllItems();
  const rewards = useActivityRewards();
  const [includeActivities, setIncludeActivities] = useState(false);
  const [busy, setBusy] = useState(false);

  const proposal = useMemo(() => proposeRebalance(items, rewards), [items, rewards]);
  const itemChanges = proposal.items.filter(d => d.changed).length;
  const activityChanges = proposal.activities.filter(d => d.changed).length;
  const willApplyActivities = includeActivities ? activityChanges : 0;

  async function apply() {
    setBusy(true);
    try {
      const changed = proposal.items.filter(d => d.changed);
      for (const d of changed) {
        await updateCustomItem(d.item.id, {
          price: d.next.price,
          bonusPct: d.next.bonusPct,
          discountPct: d.next.discountPct,
          critChancePct: d.next.critPct,
          bossBonusPct: d.next.bossPct,
        });
      }
      if (includeActivities && activityChanges > 0) {
        const values: Partial<Record<ActivityType, number>> = {};
        proposal.activities.filter(d => d.changed).forEach(d => { values[d.activity] = d.next; });
        await setActivityRewards(values);
      }
      toast.success(
        `Rebalanced ${changed.length} item${changed.length === 1 ? "" : "s"}` +
        (includeActivities && activityChanges > 0 ? " + activity rewards" : "")
      );
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Rebalance failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Preview rebalance</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="items" className="flex-1 overflow-hidden flex flex-col">
          <TabsList>
            <TabsTrigger value="items">Shop items ({itemChanges} change{itemChanges === 1 ? "" : "s"})</TabsTrigger>
            <TabsTrigger value="activities">Activity rewards ({activityChanges} change{activityChanges === 1 ? "" : "s"})</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="flex-1 overflow-auto mt-2 space-y-2">
            <div className="text-[11px] text-muted-foreground italic px-1">
              Endgame loadout ceilings (10-item all-legendary) — Bonus +{Math.round(ENDGAME_CEILING.bonus * 100)}%, Discount −{Math.round(ENDGAME_CEILING.discount * 100)}%, Crit {Math.round(ENDGAME_CEILING.crit * 100)}%, Boss +{Math.round(ENDGAME_CEILING.boss * 100)}%.
            </div>
            <ItemsTable diffs={proposal.items} />
          </TabsContent>

          <TabsContent value="activities" className="flex-1 overflow-auto mt-2 space-y-3">
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--btn-orange))]"
                checked={includeActivities}
                onChange={e => setIncludeActivities(e.target.checked)}
              />
              <span>Also rebalance activity rewards</span>
            </label>
            <ActivitiesTable diffs={proposal.activities} dim={!includeActivities} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-3">
          <div className="flex-1 text-xs text-muted-foreground">
            Will apply: <b>{itemChanges}</b> item{itemChanges === 1 ? "" : "s"}
            {willApplyActivities > 0 && <> + <b>{willApplyActivities}</b> activit{willApplyActivities === 1 ? "y" : "ies"}</>}
          </div>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={apply} disabled={busy || (itemChanges === 0 && willApplyActivities === 0)}>
            {busy ? "Applying…" : "Apply rebalance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Cell({ now, next }: { now: number; next: number }) {
  const changed = now !== next;
  return (
    <span className={cn("tabular-nums", changed ? "font-semibold text-foreground" : "text-muted-foreground")}>
      {now} {changed && <span className="text-[hsl(var(--btn-orange))]">→ {next}</span>}
    </span>
  );
}

function ItemsTable({ diffs }: { diffs: ItemDiff[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Rarity</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Bonus %</TableHead>
          <TableHead>Discount %</TableHead>
          <TableHead>Crit %</TableHead>
          <TableHead>Boss %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {diffs.map(d => (
          <TableRow key={d.item.id} className={cn(!d.changed && "opacity-50")}>
            <TableCell className="py-2">{d.item.name}</TableCell>
            <TableCell className="py-2 capitalize">{d.item.rarity}</TableCell>
            <TableCell className="py-2"><Cell now={d.now.price} next={d.next.price} /></TableCell>
            <TableCell className="py-2"><Cell now={d.now.bonusPct} next={d.next.bonusPct} /></TableCell>
            <TableCell className="py-2"><Cell now={d.now.discountPct} next={d.next.discountPct} /></TableCell>
            <TableCell className="py-2"><Cell now={d.now.critPct} next={d.next.critPct} /></TableCell>
            <TableCell className="py-2"><Cell now={d.now.bossPct} next={d.next.bossPct} /></TableCell>
          </TableRow>
        ))}
        {diffs.length === 0 && (
          <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No items.</TableCell></TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function ActivitiesTable({ diffs, dim }: { diffs: ActivityDiff[]; dim: boolean }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Activity</TableHead>
          <TableHead>Now</TableHead>
          <TableHead>New</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {diffs.map(d => (
          <TableRow key={d.activity} className={cn((dim || !d.changed) && "opacity-50")}>
            <TableCell className="py-2">{ACTIVITY_LABELS[d.activity]}</TableCell>
            <TableCell className="py-2 tabular-nums">{d.now}</TableCell>
            <TableCell className="py-2 tabular-nums">
              {d.changed ? <span className="font-semibold text-[hsl(var(--btn-orange))]">{d.next}</span> : d.next}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

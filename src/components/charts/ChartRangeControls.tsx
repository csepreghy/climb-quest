import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ChartMonths = 1 | 3 | 6 | 12;

function shiftedDate(date: Date, months: number) {
  const copy = new Date(date);
  const targetDay = copy.getDate();
  copy.setDate(1);
  copy.setMonth(copy.getMonth() + months);
  copy.setDate(Math.min(targetDay, new Date(copy.getFullYear(), copy.getMonth() + 1, 0).getDate()));
  return copy;
}

export function useChartRange() {
  const [months, setMonths] = useState<ChartMonths>(3);
  const [monthOffset, setMonthOffset] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("left");

  const range = useMemo(() => {
    const now = new Date();
    const end = shiftedDate(now, -monthOffset);
    end.setHours(23, 59, 59, 999);
    const start = shiftedDate(end, -months);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }, [months, monthOffset]);

  const moveEarlier = () => {
    setDirection("left");
    setMonthOffset(value => value + 1);
  };
  const moveLater = () => {
    setDirection("right");
    setMonthOffset(value => Math.max(0, value - 1));
  };
  const changeMonths = (value: string) => {
    setDirection("left");
    setMonths(Number(value) as ChartMonths);
  };

  return {
    ...range,
    months,
    monthOffset,
    direction,
    animationKey: `${months}-${monthOffset}`,
    moveEarlier,
    moveLater,
    changeMonths,
  };
}

export function ChartRangeControls({
  start,
  end,
  months,
  monthOffset,
  onEarlier,
  onLater,
  onMonthsChange,
}: {
  start: Date;
  end: Date;
  months: ChartMonths;
  monthOffset: number;
  onEarlier: () => void;
  onLater: () => void;
  onMonthsChange: (value: string) => void;
}) {
  const sameYear = start.getFullYear() === end.getFullYear();
  const label = `${start.toLocaleDateString(undefined, { month: "short", year: sameYear ? undefined : "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", year: "numeric" })}`;

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <span className="mr-1 text-[10px] text-muted-foreground tabular-nums" aria-live="polite">{label}</span>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onEarlier} aria-label="View one month earlier" title="View one month earlier">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={onLater} disabled={monthOffset === 0} aria-label="View one month later" title="View one month later">
        <ChevronRight className="h-4 w-4" />
      </Button>
      <Select value={String(months)} onValueChange={onMonthsChange}>
        <SelectTrigger className="h-8 w-[104px] text-xs" aria-label="Chart timeframe">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1 month</SelectItem>
          <SelectItem value="3">3 months</SelectItem>
          <SelectItem value="6">6 months</SelectItem>
          <SelectItem value="12">12 months</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function ChartMotion({ animationKey, direction, children, className }: { animationKey: string; direction: "left" | "right"; children: React.ReactNode; className?: string }) {
  return (
    <div key={animationKey} className={cn(direction === "left" ? "animate-chart-slide-left" : "animate-chart-slide-right", className)}>
      {children}
    </div>
  );
}
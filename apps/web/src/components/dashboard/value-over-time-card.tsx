import { useMemo, useState } from "react";
import { useGroupStatisticsPriceOverTime } from "~/api/generated/endpoints/statistics/statistics";
import { formatCurrency, formatDate } from "~/components/items/format";
import { QueryError } from "~/components/items/query-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";

const RANGES = [
  { value: "12m", label: "Last 12 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "ytd", label: "Year to date" },
];

function rangeFor(value: string) {
  const end = new Date();
  const start = new Date(end);
  if (value === "ytd") {
    start.setMonth(0, 1);
  } else {
    start.setMonth(start.getMonth() - (value === "6m" ? 6 : 12));
  }
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

const W = 900;
const H = 200;
const PAD = 20;

function AreaChart({ points }: { points: { date?: string; value: number }[] }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const x = (i: number) => (points.length === 1 ? W / 2 : (i / (points.length - 1)) * W);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-56 w-full overflow-visible text-primary"
        role="img"
        aria-label="Purchase value over time"
      >
        <defs>
          <linearGradient id="value-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[PAD, H / 2, H - PAD].map((gy) => (
          <line
            key={gy}
            x1="0"
            x2={W}
            y1={gy}
            y2={gy}
            className="stroke-border"
            strokeDasharray="3 3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        <path d={area} fill="url(#value-area)" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{formatDate(points[0]?.date)}</span>
        <span>{formatCurrency(max)} peak</span>
        <span>{formatDate(points[points.length - 1]?.date)}</span>
      </div>
    </div>
  );
}

export function ValueOverTimeCard() {
  const [range, setRange] = useState("12m");
  const params = useMemo(() => rangeFor(range), [range]);
  const { data, isPending, error, refetch } = useGroupStatisticsPriceOverTime(params);

  const points = (data?.entries ?? []).map((e) => ({ date: e.date, value: e.value ?? 0 }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Purchase value over time</CardTitle>
        <CardDescription>Cumulative acquisition value across all locations</CardDescription>
        <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
          <Select items={RANGES} value={range} onValueChange={(v) => setRange(v ?? "12m")}>
            <SelectTrigger aria-label="Date range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <QueryError error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-56 w-full" />
        ) : points.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            No purchase data in this period.
          </p>
        ) : (
          <AreaChart points={points} />
        )}
      </CardContent>
    </Card>
  );
}

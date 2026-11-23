import {
  useGroupStatisticsLocations,
  useGroupStatisticsTags,
} from "~/api/generated/endpoints/statistics/statistics";
import { formatNumber } from "~/components/items/format";
import { QueryError } from "~/components/items/query-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

const SWATCHES = ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"];
const STROKES = [
  "stroke-chart-1",
  "stroke-chart-2",
  "stroke-chart-3",
  "stroke-chart-4",
  "stroke-chart-5",
];

function topFive<T extends { total?: number }>(rows: T[] | undefined) {
  return [...(rows ?? [])].sort((a, b) => (b.total ?? 0) - (a.total ?? 0)).slice(0, 5);
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}

export function ItemsByLocationCard() {
  const { data, isPending, error, refetch } = useGroupStatisticsLocations();
  const rows = topFive(data);
  const max = Math.max(...rows.map((r) => r.total ?? 0), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Items by location</CardTitle>
        <CardDescription>Top 5 rooms &amp; storage zones by item count</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <QueryError error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <ListSkeleton />
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No locations yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.map((row, i) => (
              <div key={row.id ?? i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{row.name}</span>
                  <span className="font-mono text-muted-foreground">{formatNumber(row.total)}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${SWATCHES[i % SWATCHES.length]}`}
                    style={{ width: `${((row.total ?? 0) / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const RADIUS = 14;
const CIRC = 2 * Math.PI * RADIUS;

export function ItemsByTagCard() {
  const { data, isPending, error, refetch } = useGroupStatisticsTags();
  const rows = topFive(data);
  const sum = rows.reduce((acc, r) => acc + (r.total ?? 0), 0);

  let offset = 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Items by tag</CardTitle>
        <CardDescription>Distribution across your top inventory tags</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <QueryError error={error} onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : rows.length === 0 || sum === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No tagged items yet.</p>
        ) : (
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="relative size-40 shrink-0">
              <svg
                viewBox="0 0 36 36"
                className="size-full -rotate-90"
                role="img"
                aria-label="Items by tag"
              >
                <circle
                  cx="18"
                  cy="18"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="5"
                  className="stroke-muted"
                />
                {rows.map((row, i) => {
                  const len = ((row.total ?? 0) / sum) * CIRC;
                  const circle = (
                    <circle
                      key={row.id ?? i}
                      cx="18"
                      cy="18"
                      r={RADIUS}
                      fill="none"
                      strokeWidth="5"
                      className={STROKES[i % STROKES.length]}
                      strokeDasharray={`${len} ${CIRC}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += len;
                  return circle;
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold">{formatNumber(sum)}</span>
                <span className="text-[11px] text-muted-foreground">Tagged</span>
              </div>
            </div>
            <div className="grid w-full flex-1 grid-cols-1 gap-2.5">
              {rows.map((row, i) => (
                <div key={row.id ?? i} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <span className={`size-2.5 rounded-sm ${SWATCHES[i % SWATCHES.length]}`} />
                    {row.name}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {Math.round(((row.total ?? 0) / sum) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

import { DollarSign, MapPin, Package, Tag } from "lucide-react";
import type { ReactNode } from "react";
import { useGroupStatistics } from "~/api/generated/endpoints/statistics/statistics";
import { formatCurrency, formatNumber } from "~/components/items/format";
import { QueryError } from "~/components/items/query-state";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

function StatCard({
  label,
  icon,
  value,
  hint,
}: {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-muted-foreground [&_svg]:size-5">
          <span className="text-sm font-medium">{label}</span>
          {icon}
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatCards() {
  const { data, isPending, error, refetch } = useGroupStatistics();

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;

  const loading = isPending || !data;
  const value = (node: ReactNode) => (loading ? <Skeleton className="h-8 w-20" /> : node);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Total items"
        icon={<Package />}
        value={value(formatNumber(data?.totalItems))}
        hint="Across all locations"
      />
      <StatCard
        label="Locations"
        icon={<MapPin />}
        value={value(formatNumber(data?.totalLocations))}
        hint="Rooms & storage zones"
      />
      <StatCard
        label="Tags"
        icon={<Tag />}
        value={value(formatNumber(data?.totalTags))}
        hint="Categories"
      />
      <StatCard
        label="Total purchase value"
        icon={<DollarSign />}
        value={value(formatCurrency(data?.totalItemPrice))}
        hint={data ? `${formatNumber(data.totalWithWarranty)} with warranty` : "Insured assets"}
      />
    </div>
  );
}

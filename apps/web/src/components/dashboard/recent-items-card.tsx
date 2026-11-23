import { Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { useEntitiesGetAll } from "~/api/generated/endpoints/entities/entities";
import { attachmentSrc, formatRelative } from "~/components/items/format";
import { EmptyState, QueryError } from "~/components/items/query-state";
import { TagBadges } from "~/components/items/tag-badges";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export function RecentItemsCard() {
  const { data, isPending, error, refetch } = useEntitiesGetAll({
    page: 1,
    pageSize: 5,
    orderBy: "createdAt",
    orderDirection: "desc",
  });
  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="text-base">Recently added</CardTitle>
        <CardDescription>Latest items logged into your inventory</CardDescription>
        <CardAction>
          <Link to="/items" className="text-xs font-medium text-primary hover:underline">
            View all items
          </Link>
        </CardAction>
      </CardHeader>
      {error ? (
        <div className="px-4">
          <QueryError error={error} onRetry={() => refetch()} />
        </div>
      ) : isPending ? (
        <div className="space-y-3 px-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="px-4">
          <EmptyState
            icon={<Package />}
            title="No items yet"
            description="Items you add will show up here."
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14 pl-4">Item</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Asset ID</TableHead>
              <TableHead className="pr-4 text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const src = attachmentSrc(item.id ?? "", item.thumbnailId);
              return (
                <TableRow key={item.id}>
                  <TableCell className="pl-4">
                    <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg border bg-muted text-muted-foreground">
                      {src ? (
                        <img src={src} alt="" className="size-full object-cover" loading="lazy" />
                      ) : (
                        <Package className="size-4" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      to="/items/$itemId"
                      params={{ itemId: item.id ?? "" }}
                      className="hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.parent?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <TagBadges tags={item.tags} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.assetId ? `#${item.assetId}` : "—"}
                  </TableCell>
                  <TableCell className="pr-4 text-right text-xs text-muted-foreground">
                    {formatRelative(item.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

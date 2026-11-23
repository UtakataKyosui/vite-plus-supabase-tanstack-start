import { createFileRoute } from "@tanstack/react-router";
import { SearchX } from "lucide-react";
import { useEntityGet } from "~/api/generated/endpoints/entities/entities";
import { ItemDetailsTabs } from "~/components/items/item-details-tabs";
import { ItemHeader } from "~/components/items/item-header";
import { ItemDocuments, ItemGallery } from "~/components/items/item-media";
import { ApiError } from "~/api/fetcher";
import { EmptyState, QueryError } from "~/components/items/query-state";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/_authed/items/$itemId")({
  component: ItemDetailPage,
});

function ItemDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-10 w-96 max-w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-[34rem]" />
      </div>
    </div>
  );
}

function ItemDetailPage() {
  const { itemId } = Route.useParams();
  const { data: item, isPending, error, refetch } = useEntityGet(itemId);

  if (isPending) return <ItemDetailSkeleton />;

  if (error || !item) {
    if (error instanceof ApiError && error.status === 404) {
      return (
        <EmptyState
          icon={<SearchX />}
          title="Item not found"
          description="It may have been deleted or moved."
        />
      );
    }
    return <QueryError error={error} onRetry={() => refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <ItemHeader item={item} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="space-y-6">
          <ItemGallery item={item} />
          <ItemDocuments item={item} />
        </div>
        <ItemDetailsTabs item={item} />
      </div>
    </div>
  );
}

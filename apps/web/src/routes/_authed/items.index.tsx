import { keepPreviousData } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Package, Plus, SearchX, Upload } from "lucide-react";
import { useState } from "react";
import { useEntitiesGetAll } from "~/api/generated/endpoints/entities/entities";
import { BulkDeleteBar } from "~/components/items/bulk-delete-bar";
import { ItemsList, ItemsListSkeleton, ItemsPagination } from "~/components/items/items-list";
import { ItemsToolbar, type ViewMode } from "~/components/items/items-toolbar";
import { validateItemsSearch, type ItemsSearch } from "~/components/items/list-search";
import { EmptyState, QueryError } from "~/components/items/query-state";
import { PageHeader } from "~/components/layout/page-header";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";

export const Route = createFileRoute("/_authed/items/")({
  validateSearch: validateItemsSearch,
  component: ItemsPage,
});

function ItemsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Map<string, string>>(new Map());

  const page = search.page ?? 1;
  const pageSize = search.pageSize ?? 10;
  const orderBy = search.orderBy ?? "updatedAt";

  const { data, isPending, isPlaceholderData, error, refetch } = useEntitiesGetAll(
    {
      q: search.q,
      page,
      pageSize,
      tags: search.tags,
      matchAllTags: search.matchAll,
      parentIds: search.location ? [search.location] : undefined,
      entityTypeIds: search.type ? [search.type] : undefined,
      orderBy,
      orderDirection: search.dir,
    },
    { query: { placeholderData: keepPreviousData } },
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasFilters = Boolean(search.q || search.tags?.length || search.location || search.type);

  const update = (patch: Partial<ItemsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (on) next.set(id, items.find((i) => i.id === id)?.name ?? id);
      else next.delete(id);
      return next;
    });

  const toggleAll = (on: boolean) =>
    setSelected((prev) => {
      const next = new Map(prev);
      for (const item of items) {
        if (!item.id) continue;
        if (on) next.set(item.id, item.name ?? item.id);
        else next.delete(item.id);
      }
      return next;
    });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            Items
            {data && <Badge variant="secondary">{total.toLocaleString()} items</Badge>}
          </span>
        }
        description="Browse and manage your items."
        actions={
          <>
            <Link to="/tools" className={buttonVariants({ variant: "outline", size: "lg" })}>
              <Upload />
              Import / Export
            </Link>
            <Link to="/items/new" className={buttonVariants({ size: "lg" })}>
              <Plus />
              New item
            </Link>
          </>
        }
      />

      <ItemsToolbar
        search={search}
        onChange={update}
        onReset={() => navigate({ search: {}, replace: true })}
        view={view}
        onViewChange={setView}
      />

      {selected.size > 0 && (
        <BulkDeleteBar
          ids={[...selected.keys()]}
          names={[...selected.values()]}
          onDeselect={() => setSelected(new Map())}
        />
      )}

      {error && !data ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <ItemsListSkeleton view={view} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={hasFilters ? <SearchX /> : <Package />}
          title={hasFilters ? "No items match your filters" : "No items yet"}
          description={
            hasFilters
              ? "Try a different search or clear the filters."
              : "Add your first item to get started."
          }
          action={
            hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ search: {}, replace: true })}
              >
                Reset all filters
              </Button>
            ) : (
              <Link to="/items/new" className={buttonVariants({ size: "sm" })}>
                <Plus />
                New item
              </Link>
            )
          }
        />
      ) : (
        <div className={isPlaceholderData ? "opacity-60 transition-opacity" : undefined}>
          <ItemsList
            items={items}
            view={view}
            selected={new Set(selected.keys())}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        </div>
      )}

      {items.length > 0 && (
        <ItemsPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={(p) => update({ page: p === 1 ? undefined : p })}
          onPageSize={(s) => update({ pageSize: s === 10 ? undefined : s, page: undefined })}
        />
      )}
    </div>
  );
}

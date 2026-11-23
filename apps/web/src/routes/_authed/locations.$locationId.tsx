import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, MapPin, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  entityDelete,
  useEntityFullPath,
  useEntityGet,
  useLocationTreeQuery,
} from "~/api/generated/endpoints/entities/entities";
import { ConfirmDeleteDialog } from "~/components/crud/confirm-delete-dialog";
import { errorMessage, QueryError } from "~/components/crud/query-error";
import { EmptyState } from "~/components/crud/query-error";
import { PageHeader } from "~/components/layout/page-header";
import { LocationChildrenTable } from "~/components/locations/location-children-table";
import { LocationFormDialog } from "~/components/locations/location-form-dialog";
import { locationsOnly } from "~/components/locations/location-utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/_authed/locations/$locationId")({
  component: LocationDetailPage,
});

function LocationDetailPage() {
  const { locationId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const entity = useEntityGet(locationId);
  const path = useEntityFullPath(locationId);
  const treeQuery = useLocationTreeQuery();
  const tree = useMemo(() => locationsOnly(treeQuery.data), [treeQuery.data]);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const remove = useMutation({
    mutationFn: () => entityDelete(locationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      await navigate({ to: "/locations" });
    },
  });

  if (entity.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (entity.error) {
    return <QueryError error={entity.error} onRetry={() => entity.refetch()} />;
  }

  const location = entity.data;
  const children = location.children ?? [];

  return (
    <div className="space-y-6">
      <nav aria-label="Location path" className="flex flex-wrap items-center gap-1 text-sm">
        <Link to="/locations" className="text-muted-foreground hover:underline">
          Locations
        </Link>
        {path.data
          ?.filter((p) => p.id !== locationId)
          .map((p) => (
            <span key={p.id} className="flex items-center gap-1">
              <ChevronRight className="size-3.5 text-muted-foreground" />
              <Link
                to="/locations/$locationId"
                params={{ locationId: p.id ?? "" }}
                className="text-muted-foreground hover:underline"
              >
                {p.name}
              </Link>
            </span>
          ))}
      </nav>
      <PageHeader
        title={location.name}
        description={location.description || "No description."}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                remove.reset();
                setDeleteOpen(true);
              }}
            >
              <Trash2 data-icon="inline-start" />
              Delete
            </Button>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Type">
          <Badge variant="secondary">{location.entityType?.name ?? "Location"}</Badge>
        </SummaryCard>
        <SummaryCard label="Parent">
          {location.parent?.id ? (
            <Link
              to="/locations/$locationId"
              params={{ locationId: location.parent.id }}
              className="text-sm font-medium hover:underline"
            >
              {location.parent.name}
            </Link>
          ) : (
            <span className="text-sm text-muted-foreground">Top level</span>
          )}
        </SummaryCard>
        <SummaryCard label="Items">
          <span className="text-2xl font-semibold tabular-nums">
            {location.itemCount ?? children.length}
          </span>
        </SummaryCard>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Contents</h2>
        {children.length === 0 ? (
          <EmptyState
            icon={<MapPin />}
            title="Nothing here yet"
            description="Items and sub-locations placed here will appear in this list."
          />
        ) : (
          <LocationChildrenTable entities={children} />
        )}
      </section>
      <LocationFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        tree={tree}
        locationId={locationId}
      />
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete location"
        description={`Delete "${location.name ?? ""}"? Locations and items inside it may also be affected.`}
        pending={remove.isPending}
        error={remove.error ? errorMessage(remove.error) : null}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}

function SummaryCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { entityDelete, useLocationTreeQuery } from "~/api/generated/endpoints/entities/entities";
import type { RepoTreeItem } from "~/api/generated/model";
import { ConfirmDeleteDialog } from "~/components/crud/confirm-delete-dialog";
import { EmptyState, errorMessage, QueryError } from "~/components/crud/query-error";
import { PageHeader } from "~/components/layout/page-header";
import { LocationFormDialog } from "~/components/locations/location-form-dialog";
import { LocationTree } from "~/components/locations/location-tree";
import { locationsOnly } from "~/components/locations/location-utils";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/_authed/locations/")({
  component: LocationsPage,
});

type FormState = { open: boolean; locationId: string | null; parentId: string | null };

function LocationsPage() {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useLocationTreeQuery();
  const tree = useMemo(() => locationsOnly(data), [data]);
  const [form, setForm] = useState<FormState>({ open: false, locationId: null, parentId: null });
  const [deleting, setDeleting] = useState<RepoTreeItem | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => entityDelete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setDeleting(null);
    },
  });

  const openCreate = (parentId: string | null = null) =>
    setForm({ open: true, locationId: null, parentId });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Organize where your items live."
        actions={
          <Button onClick={() => openCreate()}>
            <Plus data-icon="inline-start" />
            New location
          </Button>
        }
      />
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : tree.length === 0 ? (
        <EmptyState
          icon={<MapPin />}
          title="No locations yet"
          description="Create a location such as a room or shelf."
          action={<Button onClick={() => openCreate()}>New location</Button>}
        />
      ) : (
        <LocationTree
          nodes={tree}
          onAddChild={(parent) => openCreate(parent.id ?? null)}
          onEdit={(node) => setForm({ open: true, locationId: node.id ?? null, parentId: null })}
          onDelete={(node) => {
            remove.reset();
            setDeleting(node);
          }}
        />
      )}
      <LocationFormDialog
        open={form.open}
        onOpenChange={(open) => setForm((f) => ({ ...f, open }))}
        tree={tree}
        locationId={form.locationId}
        defaultParentId={form.parentId}
      />
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete location"
        description={`Delete "${deleting?.name ?? ""}"? Locations and items inside it may also be affected.`}
        pending={remove.isPending}
        error={remove.error ? errorMessage(remove.error) : null}
        onConfirm={() => deleting?.id && remove.mutate(deleting.id)}
      />
    </div>
  );
}

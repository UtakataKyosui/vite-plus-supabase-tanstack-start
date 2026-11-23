import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Shapes } from "lucide-react";
import { useState } from "react";
import {
  entityTypeDelete,
  useEntityTypeGetAll,
} from "~/api/generated/endpoints/entity-types/entity-types";
import type { RepoEntityTypeSummary } from "~/api/generated/model";
import { ConfirmDeleteDialog } from "~/components/crud/confirm-delete-dialog";
import { EmptyState, errorMessage, QueryError } from "~/components/crud/query-error";
import { EntityTypeFormDialog } from "~/components/entity-types/entity-type-form-dialog";
import { EntityTypesTable } from "~/components/entity-types/entity-types-table";
import { PageHeader } from "~/components/layout/page-header";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/_authed/entity-types")({
  component: EntityTypesPage,
});

function EntityTypesPage() {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useEntityTypeGetAll();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RepoEntityTypeSummary | null>(null);
  const [deleting, setDeleting] = useState<RepoEntityTypeSummary | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => entityTypeDelete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setDeleting(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const entityTypes = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Entity Types"
        description="Define the kinds of items and locations you track."
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            New entity type
          </Button>
        }
      />
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : entityTypes.length === 0 ? (
        <EmptyState
          icon={<Shapes />}
          title="No entity types yet"
          description="Create an entity type to classify your entities."
          action={<Button onClick={openCreate}>New entity type</Button>}
        />
      ) : (
        <EntityTypesTable
          entityTypes={entityTypes}
          onEdit={(type) => {
            setEditing(type);
            setFormOpen(true);
          }}
          onDelete={(type) => {
            remove.reset();
            setDeleting(type);
          }}
        />
      )}
      <EntityTypeFormDialog open={formOpen} onOpenChange={setFormOpen} entityType={editing} />
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete entity type"
        description={`Delete "${deleting?.name ?? ""}"? This cannot be undone.`}
        pending={remove.isPending}
        error={remove.error ? errorMessage(remove.error) : null}
        onConfirm={() => deleting?.id && remove.mutate(deleting.id)}
      />
    </div>
  );
}

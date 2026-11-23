import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Tag } from "lucide-react";
import { useState } from "react";
import { tagDelete } from "~/api/generated/endpoints/tags/tags";
import { useTagsGetAll } from "~/api/generated/endpoints/tags/tags";
import type { RepoTagSummary } from "~/api/generated/model";
import { ConfirmDeleteDialog } from "~/components/crud/confirm-delete-dialog";
import { EmptyState, errorMessage, QueryError } from "~/components/crud/query-error";
import { PageHeader } from "~/components/layout/page-header";
import { TagFormDialog } from "~/components/tags/tag-form-dialog";
import { TagsTable } from "~/components/tags/tags-table";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";

export const Route = createFileRoute("/_authed/tags")({
  component: TagsPage,
});

function TagsPage() {
  const queryClient = useQueryClient();
  const { data, isPending, error, refetch } = useTagsGetAll();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RepoTagSummary | null>(null);
  const [deleting, setDeleting] = useState<RepoTagSummary | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => tagDelete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setDeleting(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const tags = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description="Organize your items with tags."
        actions={
          <Button onClick={openCreate}>
            <Plus data-icon="inline-start" />
            New tag
          </Button>
        }
      />
      {isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : tags.length === 0 ? (
        <EmptyState
          icon={<Tag />}
          title="No tags yet"
          description="Create your first tag to start organizing."
          action={<Button onClick={openCreate}>New tag</Button>}
        />
      ) : (
        <TagsTable
          tags={tags}
          onEdit={(tag) => {
            setEditing(tag);
            setFormOpen(true);
          }}
          onDelete={(tag) => {
            remove.reset();
            setDeleting(tag);
          }}
        />
      )}
      <TagFormDialog open={formOpen} onOpenChange={setFormOpen} tag={editing} tags={tags} />
      <ConfirmDeleteDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete tag"
        description={`Delete "${deleting?.name ?? ""}"? It will be removed from all items.`}
        pending={remove.isPending}
        error={remove.error ? errorMessage(remove.error) : null}
        onConfirm={() => deleting?.id && remove.mutate(deleting.id)}
      />
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FilePlusIcon, LayoutTemplateIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { PageHeader } from "~/components/layout/page-header";
import {
  entityTemplatesCreate,
  entityTemplatesDelete,
  entityTemplatesGet,
  entityTemplatesUpdate,
  getEntityTemplatesGetAllQueryKey,
  useEntityTemplatesGetAll,
} from "~/api/generated/endpoints/entity-templates/entity-templates";
import type {
  RepoEntityTemplateOut,
  RepoEntityTemplateSummary,
  RepoEntityTemplateUpdate,
} from "~/api/generated/model";
import { CreateItemDialog } from "./create-item-dialog";
import { TemplateForm } from "./template-form";

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}

type Editing = { mode: "create" } | { mode: "edit"; id: string } | null;

export function ItemTemplatesPage() {
  const qc = useQueryClient();
  const query = useEntityTemplatesGetAll();
  const [editing, setEditing] = useState<Editing>(null);
  const [loaded, setLoaded] = useState<RepoEntityTemplateOut | null>(null);
  const [deleting, setDeleting] = useState<RepoEntityTemplateSummary | null>(null);
  const [creatingItem, setCreatingItem] = useState<RepoEntityTemplateSummary | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: getEntityTemplatesGetAllQueryKey() });

  const close = () => {
    setEditing(null);
    setLoaded(null);
  };

  const openEdit = useMutation({
    mutationFn: (id: string) => entityTemplatesGet(id),
    onSuccess: (data, id) => {
      setLoaded(data);
      setEditing({ mode: "edit", id });
    },
  });
  const save = useMutation({
    mutationFn: (v: RepoEntityTemplateUpdate) =>
      editing?.mode === "edit"
        ? entityTemplatesUpdate(editing.id, { ...v, id: editing.id })
        : entityTemplatesCreate(v),
    onSuccess: () => {
      close();
      return invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => entityTemplatesDelete(id),
    onSuccess: () => {
      setDeleting(null);
      return invalidate();
    },
  });

  const items = query.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Item Templates"
        description="Reusable presets for quickly creating items."
        actions={
          <Button
            onClick={() => {
              save.reset();
              setLoaded(null);
              setEditing({ mode: "create" });
            }}
          >
            <PlusIcon /> New template
          </Button>
        }
      />

      {query.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-destructive">
              Failed to load templates: {errorMessage(query.error)}
            </p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <LayoutTemplateIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No item templates yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Updated</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="hidden max-w-xs truncate text-muted-foreground md:table-cell">
                      {t.description}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : ""}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => setCreatingItem(t)}>
                          <FilePlusIcon /> Create item
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit"
                          disabled={openEdit.isPending}
                          onClick={() => {
                            save.reset();
                            if (t.id) openEdit.mutate(t.id);
                          }}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete"
                          onClick={() => {
                            remove.reset();
                            setDeleting(t);
                          }}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {openEdit.isError && (
              <p className="pt-2 text-sm text-destructive">{errorMessage(openEdit.error)}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing?.mode === "edit" ? "Edit template" : "New template"}</DialogTitle>
            <DialogDescription>Defaults applied when creating an item.</DialogDescription>
          </DialogHeader>
          {editing && (
            <TemplateForm
              key={editing.mode === "edit" ? editing.id : "new"}
              initial={loaded ?? undefined}
              submitLabel={editing.mode === "edit" ? "Save changes" : "Create"}
              pending={save.isPending}
              error={save.isError ? errorMessage(save.error) : null}
              onSubmit={(v) => save.mutate(v)}
              onCancel={close}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete template</DialogTitle>
            <DialogDescription>Delete "{deleting?.name}"? This cannot be undone.</DialogDescription>
          </DialogHeader>
          {remove.isError && (
            <p className="text-sm text-destructive">{errorMessage(remove.error)}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting?.id && remove.mutate(deleting.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateItemDialog
        key={creatingItem?.id}
        template={creatingItem}
        onClose={() => setCreatingItem(null)}
      />
    </div>
  );
}

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, PlusIcon, Share2Icon, TagsIcon, Trash2Icon } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { PageHeader } from "~/components/layout/page-header";
import {
  getLabelTemplatesGetAllQueryKey,
  labelTemplatesCreate,
  labelTemplatesDelete,
  labelTemplatesDuplicate,
  useLabelTemplatesGetAll,
} from "~/api/generated/endpoints/label-templates/label-templates";
import type { RepoLabelTemplateSummary } from "~/api/generated/model";
import { LabelTemplateForm } from "./label-template-form";
import type { LabelTemplateFormValues } from "./label-template-form";

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong.";
}

export function LabelTemplatesList() {
  const qc = useQueryClient();
  const query = useLabelTemplatesGetAll();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<RepoLabelTemplateSummary | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: getLabelTemplatesGetAllQueryKey() });

  const create = useMutation({
    mutationFn: (v: LabelTemplateFormValues) =>
      labelTemplatesCreate({
        name: v.name,
        description: v.description,
        width: v.width,
        height: v.height,
        dpi: v.dpi,
        offsetX: v.offsetX,
        offsetY: v.offsetY,
        outputFormat: v.outputFormat,
        isShared: v.isShared,
        preset: v.preset,
      }),
    onSuccess: () => {
      setCreating(false);
      return invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => labelTemplatesDelete(id),
    onSuccess: () => {
      setDeleting(null);
      return invalidate();
    },
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => labelTemplatesDuplicate(id),
    onSuccess: invalidate,
  });

  const items = query.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Label Templates"
        description="Design and manage templates for printing item labels."
        actions={
          <Button
            onClick={() => {
              create.reset();
              setCreating(true);
            }}
          >
            <PlusIcon /> New template
          </Button>
        }
      />

      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : query.isError ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-destructive">
              Failed to load label templates: {errorMessage(query.error)}
            </p>
            <Button variant="outline" onClick={() => query.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <TagsIcon className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No label templates yet.</p>
            <Button onClick={() => setCreating(true)}>
              <PlusIcon /> Create your first template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => (
            <Card key={t.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link
                    to="/label-templates/$templateId"
                    params={{ templateId: t.id ?? "" }}
                    className="truncate hover:underline"
                  >
                    {t.name}
                  </Link>
                  {t.isShared && (
                    <Badge variant="secondary">
                      <Share2Icon /> Shared
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {t.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline">
                    {t.width} x {t.height} mm
                  </Badge>
                  {t.preset && <Badge variant="outline">{t.preset}</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Duplicate"
                    disabled={duplicate.isPending}
                    onClick={() => t.id && duplicate.mutate(t.id)}
                  >
                    <CopyIcon />
                  </Button>
                  {t.isOwner !== false && (
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
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New label template</DialogTitle>
            <DialogDescription>Choose a size and output settings.</DialogDescription>
          </DialogHeader>
          <LabelTemplateForm
            submitLabel="Create"
            pending={create.isPending}
            error={create.isError ? errorMessage(create.error) : null}
            onSubmit={(v) => create.mutate(v)}
            onCancel={() => setCreating(false)}
          />
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
    </div>
  );
}

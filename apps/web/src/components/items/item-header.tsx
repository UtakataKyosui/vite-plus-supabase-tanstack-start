import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { Copy, MoreVertical, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  entityDelete,
  entityDuplicate,
  getGetEntityLabelUrl,
  useEntityFullPath,
} from "~/api/generated/endpoints/entities/entities";
import type { RepoEntityOut } from "~/api/generated/model";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Heading } from "~/components/ui/heading";
import { Fragment } from "react";
import { errorMessage } from "./query-state";
import { formatRelative } from "./format";

export function ItemHeader({ item }: { item: RepoEntityOut }) {
  const id = item.id ?? "";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const path = useEntityFullPath(id).data ?? [];

  const duplicate = useMutation({
    mutationFn: () =>
      entityDuplicate(id, {
        copyAttachments: false,
        copyCustomFields: true,
        copyMaintenance: false,
        copyPrefix: "Copy of ",
      }),
    onSuccess: async (copy) => {
      await queryClient.invalidateQueries();
      if (copy.id) await navigate({ to: "/items/$itemId", params: { itemId: copy.id } });
    },
  });

  const remove = useMutation({
    mutationFn: () => entityDelete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      await navigate({ to: "/items" });
    },
  });

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/items" />}>Items</BreadcrumbLink>
            </BreadcrumbItem>
            {path
              .filter((p) => p.id !== id)
              .map((p) => (
                <Fragment key={p.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {p.type === "item" ? (
                      <BreadcrumbLink
                        render={<Link to="/items/$itemId" params={{ itemId: p.id ?? "" }} />}
                      >
                        {p.name}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbLink
                        render={
                          <Link to="/locations/$locationId" params={{ locationId: p.id ?? "" }} />
                        }
                      >
                        {p.name}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {item.archived ? (
            <Badge variant="outline">Archived</Badge>
          ) : (
            <Badge variant="secondary">Active asset</Badge>
          )}
          <span className="font-mono">Updated {formatRelative(item.updatedAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <Heading level={2} className="break-words">
            {item.name}
          </Heading>
          <div className="flex flex-wrap items-center gap-2">
            {item.assetId && (
              <Badge variant="outline" className="font-mono">
                #{item.assetId}
              </Badge>
            )}
            {item.entityType?.name && <Badge variant="secondary">{item.entityType.name}</Badge>}
            {item.tags?.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={() => duplicate.mutate()}
            disabled={duplicate.isPending}
          >
            <Copy />
            {duplicate.isPending ? "Duplicating..." : "Duplicate"}
          </Button>
          <a
            href={`/api${getGetEntityLabelUrl(id, { print: true })}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ size: "lg" })}
          >
            <Printer />
            Print label
          </a>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon-lg" aria-label="More actions" />}
            >
              <MoreVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
                <Trash2 />
                Delete item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {duplicate.error && (
        <p className="text-sm text-destructive">{errorMessage(duplicate.error)}</p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this item?</DialogTitle>
            <DialogDescription>
              "{item.name}" and its attachments will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {remove.error && <p className="text-sm text-destructive">{errorMessage(remove.error)}</p>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}

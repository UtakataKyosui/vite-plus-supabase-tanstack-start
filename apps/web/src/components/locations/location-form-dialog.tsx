import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  entitiesCreate,
  entityGet,
  entityUpdate,
} from "~/api/generated/endpoints/entities/entities";
import { useEntityTypeGetAll } from "~/api/generated/endpoints/entity-types/entity-types";
import type { RepoTreeItem } from "~/api/generated/model";
import { errorMessage } from "~/components/crud/query-error";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { descendantIds, flattenLocations, toEntityUpdate } from "./location-utils";

const NO_PARENT = "__none__";

type LocationFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: RepoTreeItem[];
  /** Existing location id when editing. */
  locationId?: string | null;
  /** Preselected parent when creating a child location. */
  defaultParentId?: string | null;
};

export function LocationFormDialog({ open, onOpenChange, ...props }: LocationFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <LocationFormLoader {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function LocationFormLoader({
  locationId,
  ...props
}: Omit<LocationFormDialogProps, "open" | "onOpenChange"> & { onDone: () => void }) {
  const existing = useQuery({
    queryKey: ["location-form", locationId],
    queryFn: () => entityGet(locationId ?? ""),
    enabled: Boolean(locationId),
    gcTime: 0,
  });

  if (locationId && existing.isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (locationId && existing.error) {
    return <p className="text-sm text-destructive">{errorMessage(existing.error)}</p>;
  }
  return <LocationForm {...props} locationId={locationId} entity={existing.data} />;
}

function LocationForm({
  tree,
  locationId,
  entity,
  defaultParentId,
  onDone,
}: Omit<LocationFormDialogProps, "open" | "onOpenChange"> & {
  entity?: Awaited<ReturnType<typeof entityGet>>;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: entityTypes } = useEntityTypeGetAll();
  const locationTypes = (entityTypes ?? []).filter((t) => t.isLocation);

  const [name, setName] = useState(entity?.name ?? "");
  const [description, setDescription] = useState(entity?.description ?? "");
  const [parentId, setParentId] = useState(entity?.parent?.id ?? defaultParentId ?? NO_PARENT);
  const [typeId, setTypeId] = useState<string | null>(entity?.entityType?.id ?? null);

  const effectiveTypeId = typeId ?? locationTypes[0]?.id ?? null;
  const blocked = locationId ? descendantIds(tree, locationId) : new Set<string>();
  const parentItems = [
    { value: NO_PARENT, label: "No parent (top level)" },
    ...flattenLocations(tree)
      .filter((l) => !blocked.has(l.id))
      .map((l) => ({ value: l.id, label: `${"  ".repeat(l.depth)}${l.name}` })),
  ];
  const typeItems = locationTypes.map((t) => ({ value: t.id ?? "", label: t.name ?? "" }));

  const mutation = useMutation({
    mutationFn: () => {
      const parent = parentId === NO_PARENT ? null : parentId;
      if (entity) {
        return entityUpdate(entity.id ?? "", {
          ...toEntityUpdate(entity),
          name: name.trim(),
          description,
          parentId: parent,
          entityTypeId: effectiveTypeId,
        });
      }
      return entitiesCreate({
        name: name.trim(),
        description,
        parentId: parent,
        entityTypeId: effectiveTypeId,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      onDone();
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>{entity ? "Edit location" : "Create location"}</DialogTitle>
        <DialogDescription>Locations describe where your items are stored.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="location-name">Name</Label>
        <Input
          id="location-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location-description">Description</Label>
        <Textarea
          id="location-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Parent location</Label>
        <Select
          items={parentItems}
          value={parentId}
          onValueChange={(v) => setParentId(v ?? NO_PARENT)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {parentItems.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {locationTypes.length > 1 && (
        <div className="space-y-2">
          <Label>Type</Label>
          <Select items={typeItems} value={effectiveTypeId} onValueChange={(v) => setTypeId(v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeItems.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {mutation.error && <p className="text-sm text-destructive">{errorMessage(mutation.error)}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending || !name.trim()}>
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

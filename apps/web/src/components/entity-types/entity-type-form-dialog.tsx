import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  entityTypeCreate,
  entityTypeUpdate,
} from "~/api/generated/endpoints/entity-types/entity-types";
import type { RepoEntityTypeSummary } from "~/api/generated/model";
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
import { Switch } from "~/components/ui/switch";

type EntityTypeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType?: RepoEntityTypeSummary | null;
};

export function EntityTypeFormDialog({
  open,
  onOpenChange,
  entityType,
}: EntityTypeFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <EntityTypeForm entityType={entityType} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EntityTypeForm({
  entityType,
  onDone,
}: {
  entityType?: RepoEntityTypeSummary | null;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(entityType?.name ?? "");
  const [icon, setIcon] = useState(entityType?.icon ?? "");
  const [isLocation, setIsLocation] = useState(entityType?.isLocation ?? false);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        icon,
        isLocation,
        defaultTemplateId: entityType?.defaultTemplateId,
      };
      return entityType?.id
        ? entityTypeUpdate(entityType.id, { ...body, id: entityType.id })
        : entityTypeCreate(body);
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
        <DialogTitle>{entityType ? "Edit entity type" : "Create entity type"}</DialogTitle>
        <DialogDescription>Entity types classify items and locations.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="entity-type-name">Name</Label>
        <Input
          id="entity-type-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="entity-type-icon">Icon</Label>
        <Input id="entity-type-icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="entity-type-is-location">Location type</Label>
          <p className="text-xs text-muted-foreground">
            Entities of this type can contain other entities.
          </p>
        </div>
        <Switch id="entity-type-is-location" checked={isLocation} onCheckedChange={setIsLocation} />
      </div>
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

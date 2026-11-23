import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useEntityTypeGetAll } from "~/api/generated/endpoints/entity-types/entity-types";
import {
  entitiesGetAll,
  getEntitiesGetAllQueryKey,
} from "~/api/generated/endpoints/entities/entities";
import { entityTemplatesCreateItem } from "~/api/generated/endpoints/entity-templates/entity-templates";
import type { RepoEntityTemplateSummary } from "~/api/generated/model";

type Props = {
  template: RepoEntityTemplateSummary | null;
  onClose: () => void;
};

export function CreateItemDialog({ template, onClose }: Props) {
  const qc = useQueryClient();
  const types = useEntityTypeGetAll();
  const locationTypeIds = (types.data ?? []).filter((t) => t.isLocation && t.id).map((t) => t.id!);
  const params = { entityTypeIds: locationTypeIds, pageSize: 200 };
  const locations = useQuery({
    queryKey: getEntitiesGetAllQueryKey(params),
    queryFn: () => entitiesGetAll(params),
    enabled: locationTypeIds.length > 0,
  });
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const create = useMutation({
    mutationFn: () =>
      entityTemplatesCreateItem(template?.id ?? "", {
        name: name.trim(),
        parentId: parentId ?? "",
        quantity,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["/v1/entities"] });
      onClose();
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && parentId) create.mutate();
  };

  const options = locations.data?.items ?? [];

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create item from template</DialogTitle>
          <DialogDescription>Using "{template?.name}".</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ci-name">Item name</Label>
            <Input id="ci-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={locations.isPending ? "Loading..." : "Select a location"}
                />
              </SelectTrigger>
              <SelectContent>
                {options.map((l) => (
                  <SelectItem key={l.id} value={l.id ?? ""}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!locations.isPending && options.length === 0 && (
              <p className="text-xs text-muted-foreground">No locations available.</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-qty">Quantity</Label>
            <Input
              id="ci-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, e.target.valueAsNumber || 1))}
            />
          </div>
          {create.isError && (
            <p className="text-sm text-destructive">
              {create.error instanceof Error ? create.error.message : "Failed to create item."}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !parentId || create.isPending}>
              {create.isPending ? "Creating..." : "Create item"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

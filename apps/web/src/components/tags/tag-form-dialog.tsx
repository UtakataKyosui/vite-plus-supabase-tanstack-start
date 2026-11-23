import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { tagsCreate, tagUpdate } from "~/api/generated/endpoints/tags/tags";
import type { RepoTagSummary } from "~/api/generated/model";
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
import { Textarea } from "~/components/ui/textarea";

const NO_PARENT = "__none__";

type TagFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: RepoTagSummary | null;
  tags: RepoTagSummary[];
};

export function TagFormDialog({ open, onOpenChange, tag, tags }: TagFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <TagForm tag={tag} tags={tags} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function TagForm({
  tag,
  tags,
  onDone,
}: {
  tag?: RepoTagSummary | null;
  tags: RepoTagSummary[];
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(tag?.name ?? "");
  const [description, setDescription] = useState(tag?.description ?? "");
  const [color, setColor] = useState(tag?.color || "#6366f1");
  const [icon, setIcon] = useState(tag?.icon ?? "");
  const [parentId, setParentId] = useState(tag?.parentId ?? NO_PARENT);

  const mutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        description,
        color,
        icon,
        parentId: parentId === NO_PARENT ? null : parentId,
      };
      return tag?.id ? tagUpdate(tag.id, { ...body, id: tag.id }) : tagsCreate(body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      onDone();
    },
  });

  const parentItems = [
    { value: NO_PARENT, label: "No parent" },
    ...tags
      .filter((t) => t.id !== tag?.id)
      .map((t) => ({ value: t.id ?? "", label: t.name ?? "" })),
  ];

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>{tag ? "Edit tag" : "Create tag"}</DialogTitle>
        <DialogDescription>Tags help you group and find items.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="tag-name">Name</Label>
        <Input
          id="tag-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={255}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tag-description">Description</Label>
        <Textarea
          id="tag-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tag-color">Color</Label>
          <Input
            id="tag-color"
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="p-1"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tag-icon">Icon</Label>
          <Input
            id="tag-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={255}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Parent tag</Label>
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

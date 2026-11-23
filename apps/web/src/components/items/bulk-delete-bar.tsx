import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { entityDelete } from "~/api/generated/endpoints/entities/entities";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { errorMessage } from "./query-state";

type Props = {
  names: string[];
  ids: string[];
  onDeselect: () => void;
};

export function BulkDeleteBar({ names, ids, onDeselect }: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: () => Promise.all(ids.map((id) => entityDelete(id))),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setOpen(false);
      onDeselect();
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-primary px-4 py-2.5 text-primary-foreground">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary-foreground/20 text-xs font-semibold">
          {ids.length}
        </span>
        <span className="text-sm font-medium">{ids.length === 1 ? "Item" : "Items"} selected</span>
        <span className="hidden max-w-md truncate text-xs opacity-80 sm:inline">
          {names.join(", ")}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
            <Trash2 />
            Delete
          </Button>
          <button type="button" className="text-xs font-medium underline" onClick={onDeselect}>
            Deselect
          </button>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete {ids.length} {ids.length === 1 ? "item" : "items"}?
            </DialogTitle>
            <DialogDescription>
              This permanently removes the selected items. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {mutation.error && (
            <p className="text-sm text-destructive">{errorMessage(mutation.error)}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { maintenanceEntryUpdate } from "~/api/generated/endpoints/maintenance/maintenance";
import type { RepoMaintenanceEntryWithDetails } from "~/api/generated/model";
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
import { Textarea } from "~/components/ui/textarea";
import { ErrorNotice, toDateInput } from "~/components/tools/query-state";

type Props = {
  entry: RepoMaintenanceEntryWithDetails | null;
  onClose: () => void;
  onSaved: () => void;
};

export function EditMaintenanceDialog({ entry, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [cost, setCost] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [completedDate, setCompletedDate] = useState("");

  useEffect(() => {
    if (!entry) return;
    setName(entry.name ?? "");
    setDescription(entry.description ?? "");
    setCost(entry.cost ?? "");
    setScheduledDate(toDateInput(entry.scheduledDate));
    setCompletedDate(toDateInput(entry.completedDate));
  }, [entry]);

  const save = useMutation({
    mutationFn: () =>
      maintenanceEntryUpdate(entry?.id ?? "", {
        name,
        description,
        cost,
        scheduledDate,
        completedDate,
      }),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <Dialog open={entry !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit maintenance entry</DialogTitle>
            <DialogDescription>{entry?.itemName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="maint-name">Name</Label>
            <Input
              id="maint-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maint-desc">Description</Label>
            <Textarea
              id="maint-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="maint-scheduled">Scheduled</Label>
              <Input
                id="maint-scheduled"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maint-completed">Completed</Label>
              <Input
                id="maint-completed"
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maint-cost">Cost</Label>
              <Input
                id="maint-cost"
                inputMode="decimal"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>
          </div>
          {save.error && <ErrorNotice error={save.error} />}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Wrench } from "lucide-react";
import { useState } from "react";
import {
  maintenanceEntryCreate,
  useMaintenanceLogGet,
} from "~/api/generated/endpoints/item-maintenance/item-maintenance";
import { Badge } from "~/components/ui/badge";
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
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { formatDate } from "./format";
import { EmptyState, QueryError, errorMessage } from "./query-state";

function hasDate(value?: string) {
  return Boolean(value) && new Date(value as string).getFullYear() > 1;
}

function statusOf(completed?: string, scheduled?: string) {
  if (hasDate(completed)) return { label: "Completed", variant: "secondary" as const };
  if (hasDate(scheduled) && new Date(scheduled as string).getTime() < Date.now()) {
    return { label: "Overdue", variant: "destructive" as const };
  }
  return { label: "Scheduled", variant: "outline" as const };
}

export function MaintenancePanel({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const { data, isPending, error, refetch } = useMaintenanceLogGet(itemId, { status: "both" });
  const entries = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Maintenance log</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus />
          Add entry
        </Button>
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<Wrench />}
          title="No maintenance entries"
          description="Log service, repairs or scheduled upkeep for this item."
        />
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const status = statusOf(entry.completedDate, entry.scheduledDate);
            return (
              <li key={entry.id} className="space-y-1 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{entry.name}</span>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                {entry.description && (
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                )}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    Scheduled:{" "}
                    {hasDate(entry.scheduledDate) ? formatDate(entry.scheduledDate) : "—"}
                  </span>
                  <span>
                    Completed:{" "}
                    {hasDate(entry.completedDate) ? formatDate(entry.completedDate) : "—"}
                  </span>
                  {entry.cost && entry.cost !== "0" && <span>Cost: {entry.cost}</span>}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <MaintenanceForm itemId={itemId} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MaintenanceForm({ itemId, onDone }: { itemId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [completedDate, setCompletedDate] = useState("");
  const [cost, setCost] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const costInvalid = cost.trim() !== "" && !(Number(cost) >= 0);

  const mutation = useMutation({
    mutationFn: () =>
      maintenanceEntryCreate(itemId, {
        name: name.trim(),
        description,
        scheduledDate: scheduledDate || undefined,
        completedDate: completedDate || undefined,
        cost: cost.trim() || undefined,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      onDone();
    },
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
        if (!name.trim() || costInvalid) return;
        mutation.mutate();
      }}
    >
      <DialogHeader>
        <DialogTitle>Add maintenance entry</DialogTitle>
        <DialogDescription>Record completed work or schedule upcoming upkeep.</DialogDescription>
      </DialogHeader>
      <div className="space-y-1.5">
        <Label htmlFor="m-name">Name *</Label>
        <Input
          id="m-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={submitted && !name.trim()}
          autoFocus
        />
        {submitted && !name.trim() && <p className="text-xs text-destructive">Name is required.</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="m-desc">Description</Label>
        <Textarea
          id="m-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="m-scheduled">Scheduled date</Label>
          <Input
            id="m-scheduled"
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="m-completed">Completed date</Label>
          <Input
            id="m-completed"
            type="date"
            value={completedDate}
            onChange={(e) => setCompletedDate(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="m-cost">Cost</Label>
        <Input
          id="m-cost"
          inputMode="decimal"
          value={cost}
          onChange={(e) => setCost(e.target.value)}
          aria-invalid={submitted && costInvalid}
        />
        {submitted && costInvalid && (
          <p className="text-xs text-destructive">Enter a cost of 0 or more.</p>
        )}
      </div>
      {mutation.error && <p className="text-sm text-destructive">{errorMessage(mutation.error)}</p>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={mutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}

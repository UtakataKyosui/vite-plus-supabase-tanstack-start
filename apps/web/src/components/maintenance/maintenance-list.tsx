import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Pencil, Trash2, Wrench } from "lucide-react";
import {
  maintenanceEntryDelete,
  maintenanceEntryUpdate,
} from "~/api/generated/endpoints/maintenance/maintenance";
import { useMaintenanceGetAll } from "~/api/generated/endpoints/maintenance/maintenance";
import type { RepoMaintenanceEntryWithDetails } from "~/api/generated/model";
import { MaintenanceGetAllStatus } from "~/api/generated/model";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Text } from "~/components/ui/text";
import { ConfirmDialog } from "~/components/tools/confirm-dialog";
import { ErrorNotice, RowsSkeleton, formatDate, toDateInput } from "~/components/tools/query-state";
import { EditMaintenanceDialog } from "./edit-maintenance-dialog";

type Status = (typeof MaintenanceGetAllStatus)[keyof typeof MaintenanceGetAllStatus];

const isCompleted = (entry: RepoMaintenanceEntryWithDetails) =>
  toDateInput(entry.completedDate) !== "";

export function MaintenanceList() {
  const [status, setStatus] = useState<Status>(
    MaintenanceGetAllStatus.MaintenanceFilterStatusScheduled,
  );
  const [editing, setEditing] = useState<RepoMaintenanceEntryWithDetails | null>(null);
  const [deleting, setDeleting] = useState<RepoMaintenanceEntryWithDetails | null>(null);
  const queryClient = useQueryClient();
  const { data, isPending, error } = useMaintenanceGetAll({ status });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["/v1/maintenance"] });

  const complete = useMutation({
    mutationFn: (entry: RepoMaintenanceEntryWithDetails) =>
      maintenanceEntryUpdate(entry.id ?? "", {
        name: entry.name,
        description: entry.description,
        cost: entry.cost,
        scheduledDate: toDateInput(entry.scheduledDate),
        completedDate: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => maintenanceEntryDelete(id),
    onSuccess: () => {
      setDeleting(null);
      return invalidate();
    },
  });

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={(value) => setStatus(value as Status)}>
        <TabsList>
          <TabsTrigger value={MaintenanceGetAllStatus.MaintenanceFilterStatusScheduled}>
            Scheduled
          </TabsTrigger>
          <TabsTrigger value={MaintenanceGetAllStatus.MaintenanceFilterStatusCompleted}>
            Completed
          </TabsTrigger>
          <TabsTrigger value={MaintenanceGetAllStatus.MaintenanceFilterStatusBoth}>All</TabsTrigger>
        </TabsList>
      </Tabs>

      {complete.error && <ErrorNotice error={complete.error} />}

      <Card>
        <CardContent>
          {isPending ? (
            <RowsSkeleton rows={4} />
          ) : error ? (
            <ErrorNotice error={error} />
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Wrench className="size-8 text-muted-foreground" />
              <Text tone="muted">No maintenance entries found.</Text>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-end">Cost</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.name}
                      {entry.description && (
                        <p className="text-xs font-normal text-muted-foreground">
                          {entry.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.itemID ? (
                        <Link
                          to="/items/$itemId"
                          params={{ itemId: entry.itemID }}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {entry.itemName}
                        </Link>
                      ) : (
                        entry.itemName
                      )}
                    </TableCell>
                    <TableCell>{formatDate(entry.scheduledDate)}</TableCell>
                    <TableCell>
                      {isCompleted(entry) ? (
                        <Badge variant="secondary">{formatDate(entry.completedDate)}</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">{entry.cost || "—"}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {!isCompleted(entry) && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Mark as completed"
                            disabled={complete.isPending}
                            onClick={() => complete.mutate(entry)}
                          >
                            <CheckCircle2 />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Edit"
                          onClick={() => setEditing(entry)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Delete"
                          onClick={() => setDeleting(entry)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <EditMaintenanceDialog
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={invalidate}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete maintenance entry"
        description={`"${deleting?.name ?? ""}" will be permanently deleted.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting?.id && remove.mutate(deleting.id)}
      >
        {remove.error && <ErrorNotice error={remove.error} />}
      </ConfirmDialog>
    </div>
  );
}

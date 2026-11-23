import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BellRing, Plus, Send, Trash2 } from "lucide-react";
import {
  createNotifier,
  deleteNotifier,
  getGetUserNotifiersQueryKey,
  notifierTest,
  updateNotifier,
  useGetUserNotifiers,
} from "~/api/generated/endpoints/notifiers/notifiers";
import type { RepoNotifierOut } from "~/api/generated/model";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Text } from "~/components/ui/text";
import { ConfirmDialog } from "~/components/tools/confirm-dialog";
import { ErrorNotice, RowsSkeleton } from "~/components/tools/query-state";

export function NotifiersCard() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useGetUserNotifiers();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [deleting, setDeleting] = useState<RepoNotifierOut | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getGetUserNotifiersQueryKey() });

  const create = useMutation({
    mutationFn: () => createNotifier({ name, url, isActive: true }),
    onSuccess: () => {
      setOpen(false);
      return refresh();
    },
  });
  const toggle = useMutation({
    mutationFn: (notifier: RepoNotifierOut) =>
      updateNotifier(notifier.id ?? "", {
        name: notifier.name ?? "",
        isActive: !notifier.isActive,
      }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteNotifier(id),
    onSuccess: () => {
      setDeleting(null);
      return refresh();
    },
  });
  const test = useMutation({
    mutationFn: (testUrl: string) => notifierTest({ url: testUrl }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifiers</CardTitle>
        <CardDescription>Send maintenance reminders to a webhook or service URL.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Text tone="muted" size="sm" role="status">
            {test.isSuccess ? "Test notification sent." : " "}
          </Text>
          <Button
            onClick={() => {
              create.reset();
              setName("");
              setUrl("");
              setOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            Add notifier
          </Button>
        </div>
        {toggle.error && <ErrorNotice error={toggle.error} />}
        {test.error && <ErrorNotice error={test.error} />}
        {isPending ? (
          <RowsSkeleton />
        ) : error ? (
          <ErrorNotice error={error} />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <BellRing className="size-6 text-muted-foreground" />
            <Text tone="muted">No notifiers configured.</Text>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((notifier) => (
                <TableRow key={notifier.id}>
                  <TableCell className="font-medium">{notifier.name}</TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">
                    {notifier.url}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={notifier.isActive ?? false}
                      disabled={toggle.isPending}
                      aria-label={`Toggle ${notifier.name ?? "notifier"}`}
                      onCheckedChange={() => toggle.mutate(notifier)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Send test notification"
                        disabled={test.isPending || !notifier.url}
                        onClick={() => notifier.url && test.mutate(notifier.url)}
                      >
                        <Send />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${notifier.name ?? "notifier"}`}
                        onClick={() => setDeleting(notifier)}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={submit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Add notifier</DialogTitle>
              <DialogDescription>
                Enter a name and the URL that receives notifications.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="notifier-name">Name</Label>
              <Input
                id="notifier-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifier-url">URL</Label>
              <Input
                id="notifier-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>
            {create.error && <ErrorNotice error={create.error} />}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete notifier"
        description={`"${deleting?.name ?? ""}" will no longer receive notifications.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => deleting?.id && remove.mutate(deleting.id)}
      >
        {remove.error && <ErrorNotice error={remove.error} />}
      </ConfirmDialog>
    </Card>
  );
}

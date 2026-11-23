import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import {
  getUserAPIKeysListQueryKey,
  userAPIKeyCreate,
  userAPIKeyDelete,
  useUserAPIKeysList,
} from "~/api/generated/endpoints/user/user";
import type { RepoAPIKeyOut } from "~/api/generated/model";
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
import { ErrorNotice, RowsSkeleton, formatDate } from "~/components/tools/query-state";

export function ApiKeysCard() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useUserAPIKeysList();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [deleting, setDeleting] = useState<RepoAPIKeyOut | null>(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: getUserAPIKeysListQueryKey() });

  const create = useMutation({
    mutationFn: () =>
      userAPIKeyCreate({
        name,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => userAPIKeyDelete(id),
    onSuccess: () => {
      setDeleting(null);
      return refresh();
    },
  });

  const openDialog = () => {
    create.reset();
    setName("");
    setExpiresAt("");
    setOpen(true);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  const token = create.data?.token;

  return (
    <Card>
      <CardHeader>
        <CardTitle>API keys</CardTitle>
        <CardDescription>Keys let scripts and integrations access your account.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={openDialog}>
            <Plus data-icon="inline-start" />
            Create API key
          </Button>
        </div>
        {isPending ? (
          <RowsSkeleton />
        ) : error ? (
          <ErrorNotice error={error} />
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <KeyRound className="size-6 text-muted-foreground" />
            <Text tone="muted">No API keys yet.</Text>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>{formatDate(key.createdAt)}</TableCell>
                  <TableCell>{formatDate(key.lastUsedAt)}</TableCell>
                  <TableCell>{formatDate(key.expiresAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${key.name ?? "key"}`}
                        onClick={() => setDeleting(key)}
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
          {token ? (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>API key created</DialogTitle>
                <DialogDescription>
                  Copy this key now. It will not be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 break-all rounded-lg bg-muted px-3 py-2 text-xs">
                  {token}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy key"
                  onClick={() => navigator.clipboard?.writeText(token)}
                >
                  <Copy />
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={() => setOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>Give the key a name to recognise it later.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="key-name">Name</Label>
                <Input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key-expires">Expires (optional)</Label>
                <Input
                  id="key-expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
              {create.error && <ErrorNotice error={create.error} />}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(next) => !next && setDeleting(null)}
        title="Delete API key"
        description={`"${deleting?.name ?? ""}" will stop working immediately.`}
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

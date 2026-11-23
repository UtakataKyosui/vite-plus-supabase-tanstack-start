import { useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Plus, Trash2 } from "lucide-react";
import {
  getGroupInvitationsGetAllQueryKey,
  groupInvitationsCreate,
  groupInvitationsDelete,
  useGroupInvitationsGetAll,
} from "~/api/generated/endpoints/group/group";
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
import { ErrorNotice, RowsSkeleton, formatDate } from "~/components/tools/query-state";

export function InvitationsCard() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useGroupInvitationsGetAll();
  const [open, setOpen] = useState(false);
  const [uses, setUses] = useState("1");
  const [expiresAt, setExpiresAt] = useState("");

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: getGroupInvitationsGetAllQueryKey() });

  const create = useMutation({
    mutationFn: () =>
      groupInvitationsCreate({
        uses: Number(uses),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      }),
    onSuccess: () => {
      setOpen(false);
      return refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => groupInvitationsDelete(id),
    onSuccess: refresh,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitations</CardTitle>
        <CardDescription>Share an invitation code to add people to this group.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-end">
          <Button
            onClick={() => {
              create.reset();
              setOpen(true);
            }}
          >
            <Plus data-icon="inline-start" />
            Create invitation
          </Button>
        </div>
        {remove.error && <ErrorNotice error={remove.error} />}
        {isPending ? (
          <RowsSkeleton />
        ) : error ? (
          <ErrorNotice error={error} />
        ) : data.length === 0 ? (
          <Text tone="muted" className="py-4 text-center">
            No active invitations.
          </Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Uses left</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((invitation) => (
                <TableRow key={invitation.id}>
                  <TableCell className="font-mono text-xs">{invitation.id}</TableCell>
                  <TableCell>{invitation.uses}</TableCell>
                  <TableCell>{formatDate(invitation.expiresAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Copy code"
                        onClick={() => navigator.clipboard?.writeText(invitation.id ?? "")}
                      >
                        <Copy />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Revoke invitation"
                        disabled={remove.isPending}
                        onClick={() => invitation.id && remove.mutate(invitation.id)}
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
              <DialogTitle>Create invitation</DialogTitle>
              <DialogDescription>Choose how many times the code can be used.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="invite-uses">Number of uses</Label>
              <Input
                id="invite-uses"
                type="number"
                min={1}
                max={100}
                value={uses}
                onChange={(e) => setUses(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-expires">Expires (optional)</Label>
              <Input
                id="invite-expires"
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
        </DialogContent>
      </Dialog>
    </Card>
  );
}

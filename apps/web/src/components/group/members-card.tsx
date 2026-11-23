import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserMinus } from "lucide-react";
import {
  getGroupMembersGetAllQueryKey,
  groupMemberRemove,
  useGroupMembersGetAll,
} from "~/api/generated/endpoints/group/group";
import type { RepoUserSummary } from "~/api/generated/model";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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

export function MembersCard() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useGroupMembersGetAll();
  const [removing, setRemoving] = useState<RepoUserSummary | null>(null);

  const remove = useMutation({
    mutationFn: (userId: string) => groupMemberRemove(userId),
    onSuccess: () => {
      setRemoving(null);
      return queryClient.invalidateQueries({ queryKey: getGroupMembersGetAllQueryKey() });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>People who can access this group.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <RowsSkeleton />
        ) : error ? (
          <ErrorNotice error={error} />
        ) : data.length === 0 ? (
          <Text tone="muted" className="py-4 text-center">
            No members.
          </Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        <AvatarFallback>
                          {(member.name ?? "?").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${member.name ?? "member"}`}
                        onClick={() => setRemoving(member)}
                      >
                        <UserMinus className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove member"
        description={`${removing?.name ?? "This member"} will lose access to this group.`}
        confirmLabel="Remove"
        destructive
        pending={remove.isPending}
        onConfirm={() => removing?.id && remove.mutate(removing.id)}
      >
        {remove.error && <ErrorNotice error={remove.error} />}
      </ConfirmDialog>
    </Card>
  );
}

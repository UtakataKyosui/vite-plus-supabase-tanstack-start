import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { groupDelete } from "~/api/generated/endpoints/group/group";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/tools/confirm-dialog";
import { ErrorNotice } from "~/components/tools/query-state";

export function DangerZoneCard() {
  const [open, setOpen] = useState(false);
  const remove = useMutation({
    mutationFn: () => groupDelete(),
    onSuccess: () => window.location.assign("/"),
  });

  return (
    <Card className="border border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>Deleting the group removes all of its data permanently.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => {
            remove.reset();
            setOpen(true);
          }}
        >
          Delete group
        </Button>
      </CardContent>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete group"
        description="The group and every item, location, and tag in it will be permanently deleted."
        confirmLabel="Delete group"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      >
        {remove.error && <ErrorNotice error={remove.error} />}
      </ConfirmDialog>
    </Card>
  );
}

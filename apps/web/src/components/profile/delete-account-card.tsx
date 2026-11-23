import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { userSelfDelete } from "~/api/generated/endpoints/user/user";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { ConfirmDialog } from "~/components/tools/confirm-dialog";
import { ErrorNotice } from "~/components/tools/query-state";

export function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const remove = useMutation({
    mutationFn: () => userSelfDelete(),
    onSuccess: () => window.location.assign("/"),
  });

  return (
    <Card className="border border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">Delete account</CardTitle>
        <CardDescription>Permanently delete your account and personal data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onClick={() => {
            remove.reset();
            setOpen(true);
          }}
        >
          Delete account
        </Button>
      </CardContent>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete account"
        description="Your account will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete account"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      >
        {remove.error && <ErrorNotice error={remove.error} />}
      </ConfirmDialog>
    </Card>
  );
}

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserSelfQueryKey,
  userSelfUpdate,
  useUserSelf,
} from "~/api/generated/endpoints/user/user";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { ErrorNotice } from "~/components/tools/query-state";

export function ProfileCard() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useUserSelf();
  const user = data?.item;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setEmail(user.email ?? "");
  }, [user]);

  const save = useMutation({
    mutationFn: () => userSelfUpdate({ name, email }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getUserSelfQueryKey() }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Your name and email address.</CardDescription>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <ErrorNotice error={error} />
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            {save.error && <ErrorNotice error={save.error} />}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving..." : "Save changes"}
              </Button>
              {save.isSuccess && (
                <Text tone="muted" size="sm" role="status">
                  Saved.
                </Text>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

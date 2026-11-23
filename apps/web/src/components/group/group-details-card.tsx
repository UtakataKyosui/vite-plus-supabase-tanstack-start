import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGroupGetQueryKey,
  groupUpdate,
  useGroupGet,
} from "~/api/generated/endpoints/group/group";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Skeleton } from "~/components/ui/skeleton";
import { Text } from "~/components/ui/text";
import { ErrorNotice } from "~/components/tools/query-state";

export function GroupDetailsCard() {
  const queryClient = useQueryClient();
  const { data, isPending, error } = useGroupGet();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("");

  useEffect(() => {
    if (!data) return;
    setName(data.name ?? "");
    setCurrency(data.currency ?? "");
  }, [data]);

  const save = useMutation({
    mutationFn: () => groupUpdate({ name, currency }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getGroupGetQueryKey() }),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    save.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group details</CardTitle>
        <CardDescription>The name and currency used across this group.</CardDescription>
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
                <Label htmlFor="group-name">Group name</Label>
                <Input
                  id="group-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-currency">Currency</Label>
                <Input
                  id="group-currency"
                  value={currency}
                  maxLength={3}
                  placeholder="JPY"
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
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

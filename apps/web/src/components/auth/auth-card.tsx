import { Boxes, Loader2 } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

type AuthProps = {
  actionText: string;
  description?: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  status: "pending" | "idle" | "success" | "error";
  afterSubmit?: ReactNode;
  footer?: ReactNode;
  autoComplete?: "current-password" | "new-password";
};

export function Auth({
  actionText,
  description,
  onSubmit,
  status,
  afterSubmit,
  footer,
  autoComplete = "current-password",
}: AuthProps) {
  const pending = status === "pending";

  return (
    <div className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex items-center justify-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </div>
          <span className="font-heading text-xl font-semibold">Smart Box</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{actionText}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit(e);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  type="password"
                  name="password"
                  id="password"
                  autoComplete={autoComplete}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />}
                {actionText}
              </Button>
              {afterSubmit}
            </form>
          </CardContent>
        </Card>
        {footer && <div className="text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}

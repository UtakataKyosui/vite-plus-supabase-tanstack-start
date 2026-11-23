import { AlertCircle } from "lucide-react";
import { ApiError } from "~/api/fetcher";
import { Skeleton } from "~/components/ui/skeleton";

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const body = error.body as { error?: string; message?: string } | string | undefined;
    if (typeof body === "string" && body) return body;
    if (body && typeof body === "object") return body.error ?? body.message ?? error.message;
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function ErrorNotice({ error }: { error: unknown }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" />
      <span>{errorMessage(error)}</span>
    </div>
  );
}

export function RowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) return "—";
  return date.toLocaleDateString();
}

export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) return "";
  return value.slice(0, 10);
}

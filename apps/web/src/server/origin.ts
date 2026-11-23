export const UNSAFE_METHODS: ReadonlySet<string> = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function parseAllowedOrigins(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isTrustedOrigin(request: Request, extraOrigins: readonly string[] = []): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  return origin === new URL(request.url).origin || extraOrigins.includes(origin);
}

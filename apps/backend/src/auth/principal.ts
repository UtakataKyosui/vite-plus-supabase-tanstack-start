export type Principal =
  | { kind: "session"; userId: string; email: string | null }
  | { kind: "apiKey"; userId: string; apiKeyId: string; tenantId: string | null };

export type AuthKind = Principal["kind"];

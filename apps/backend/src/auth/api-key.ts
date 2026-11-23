import type { Principal } from "./principal";

const TOKEN_PATTERN = /^sbx_[A-Za-z0-9_-]{43}$/;
const PREFIX_LENGTH = 12;
const TOUCH_INTERVAL_MS = 60_000;

export interface ApiKeyRecord {
  id: string;
  userId: string;
  tenantId: string | null;
  name: string;
  prefix: string;
  hash: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface NewApiKey {
  userId: string;
  tenantId: string | null;
  name: string;
  prefix: string;
  hash: string;
  expiresAt: Date | null;
}

export interface ApiKeyStore {
  findByHash(hash: string): Promise<ApiKeyRecord | null>;
  touch(id: string, at: Date): Promise<void>;
  insert(row: NewApiKey): Promise<ApiKeyRecord>;
  listByUser(userId: string): Promise<ApiKeyRecord[]>;
  revoke(userId: string, id: string, at: Date): Promise<void>;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function hashApiKey(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function looksLikeApiKey(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

export async function generateApiKey(): Promise<{ token: string; prefix: string; hash: string }> {
  const token = `sbx_${toBase64Url(crypto.getRandomValues(new Uint8Array(32)))}`;
  return { token, prefix: token.slice(0, PREFIX_LENGTH), hash: await hashApiKey(token) };
}

export async function verifyApiKey(
  store: ApiKeyStore,
  token: string,
  now: Date = new Date(),
): Promise<Principal | null> {
  if (!looksLikeApiKey(token)) return null;

  const record = await store.findByHash(await hashApiKey(token));
  if (!record || record.revokedAt) return null;
  if (record.expiresAt && record.expiresAt.getTime() <= now.getTime()) return null;

  const stale =
    !record.lastUsedAt || now.getTime() - record.lastUsedAt.getTime() > TOUCH_INTERVAL_MS;
  if (stale) void store.touch(record.id, now).catch(() => undefined);

  return {
    kind: "apiKey",
    userId: record.userId,
    apiKeyId: record.id,
    tenantId: record.tenantId,
  };
}

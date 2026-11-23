import type { z } from "zod";
import {
  UserAPIKeyCreateBody,
  type UserAPIKeyCreateResponse,
  type UserAPIKeysListResponse,
} from "../generated/user/user";
import { generateApiKey, type ApiKeyRecord, type ApiKeyStore } from "./api-key";
import { ValidationError } from "./errors";

export type ApiKeyCreate = z.infer<typeof UserAPIKeyCreateBody>;
export type ApiKeyCreated = z.infer<typeof UserAPIKeyCreateResponse>;
export type ApiKeyOut = z.infer<typeof UserAPIKeysListResponse>[number];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseApiKeyCreate(body: unknown): ApiKeyCreate {
  const result = UserAPIKeyCreateBody.safeParse(body);
  if (result.success) return result.data;

  const fields = result.error.issues.map((issue) => issue.path.join(".") || "body").join(", ");
  throw new ValidationError("invalid request body", fields);
}

function toOut(record: ApiKeyRecord): ApiKeyOut {
  return {
    id: record.id,
    name: record.name,
    userId: record.userId,
    createdAt: record.createdAt.toISOString(),
    expiresAt: record.expiresAt?.toISOString() ?? null,
    lastUsedAt: record.lastUsedAt?.toISOString() ?? null,
  };
}

function parseExpiry(value: string | null | undefined, now: Date): Date | null {
  if (value == null) return null;

  const expiresAt = new Date(value);
  if (Number.isNaN(expiresAt.getTime())) {
    throw new ValidationError("expiresAt must be a valid date-time", "expiresAt");
  }
  if (expiresAt.getTime() <= now.getTime()) {
    throw new ValidationError("expiresAt must be in the future", "expiresAt");
  }
  return expiresAt;
}

export async function createApiKey(
  store: ApiKeyStore,
  userId: string,
  input: ApiKeyCreate,
  now: Date = new Date(),
): Promise<ApiKeyCreated> {
  const expiresAt = parseExpiry(input.expiresAt, now);
  const { token, prefix, hash } = await generateApiKey();
  const record = await store.insert({
    userId,
    tenantId: null,
    name: input.name,
    prefix,
    hash,
    expiresAt,
  });
  return { ...toOut(record), token };
}

export async function listApiKeys(store: ApiKeyStore, userId: string): Promise<ApiKeyOut[]> {
  const records = await store.listByUser(userId);
  return records.filter((record) => !record.revokedAt).map(toOut);
}

export async function revokeApiKey(
  store: ApiKeyStore,
  userId: string,
  id: string,
  now: Date = new Date(),
): Promise<void> {
  if (!UUID_PATTERN.test(id)) return;
  await store.revoke(userId, id, now);
}

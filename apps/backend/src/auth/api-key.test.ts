import { describe, expect, test } from "vite-plus/test";
import {
  generateApiKey,
  hashApiKey,
  looksLikeApiKey,
  verifyApiKey,
  type ApiKeyRecord,
  type ApiKeyStore,
  type NewApiKey,
} from "./api-key";
import { createApiKey, listApiKeys, revokeApiKey } from "./api-keys";
import { ValidationError } from "./errors";

const NOW = new Date("2026-11-24T00:00:00Z");

function memoryStore(): ApiKeyStore & { rows: ApiKeyRecord[]; touched: string[] } {
  const rows: ApiKeyRecord[] = [];
  const touched: string[] = [];
  return {
    rows,
    touched,
    async findByHash(hash) {
      return rows.find((row) => row.hash === hash) ?? null;
    },
    async touch(id) {
      touched.push(id);
    },
    async insert(row: NewApiKey) {
      const record: ApiKeyRecord = {
        ...row,
        id: crypto.randomUUID(),
        createdAt: NOW,
        lastUsedAt: null,
        revokedAt: null,
      };
      rows.push(record);
      return record;
    },
    async listByUser(userId) {
      return rows.filter((row) => row.userId === userId);
    },
    async revoke(userId, id, at) {
      for (const row of rows) {
        if (row.userId === userId && row.id === id) row.revokedAt = at;
      }
    },
  };
}

describe("api key format", () => {
  test("generated tokens are recognised and hash deterministically", async () => {
    const { token, prefix, hash } = await generateApiKey();
    expect(looksLikeApiKey(token)).toBe(true);
    expect(token.startsWith(prefix)).toBe(true);
    expect(hash).toBe(await hashApiKey(token));
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  test.each(["", "sbx_short", "sb_secret_abc", `sbx_${"!".repeat(43)}`])("rejects %j", (token) => {
    expect(looksLikeApiKey(token)).toBe(false);
  });
});

describe("verifyApiKey", () => {
  test("accepts an issued key and returns an api key principal", async () => {
    const store = memoryStore();
    const created = await createApiKey(store, "user-1", { name: "ci" }, NOW);

    const principal = await verifyApiKey(store, created.token!, NOW);

    expect(principal).toEqual({
      kind: "apiKey",
      userId: "user-1",
      apiKeyId: created.id,
      tenantId: null,
    });
  });

  test("stores only the hash, never the token", async () => {
    const store = memoryStore();
    const created = await createApiKey(store, "user-1", { name: "ci" }, NOW);

    expect(JSON.stringify(store.rows)).not.toContain(created.token);
  });

  test("rejects unknown, revoked and expired keys", async () => {
    const store = memoryStore();
    const { token } = await createApiKey(store, "user-1", { name: "ci" }, NOW);
    const expiring = await createApiKey(
      store,
      "user-1",
      { name: "short", expiresAt: "2026-11-25T00:00:00Z" },
      NOW,
    );

    expect(await verifyApiKey(store, (await generateApiKey()).token, NOW)).toBeNull();
    expect(await verifyApiKey(store, expiring.token!, new Date("2026-11-25T00:00:00Z"))).toBeNull();

    await revokeApiKey(store, "user-1", store.rows[0]!.id, NOW);
    expect(await verifyApiKey(store, token!, NOW)).toBeNull();
  });

  test("another user cannot revoke the key", async () => {
    const store = memoryStore();
    const { token, id } = await createApiKey(store, "user-1", { name: "ci" }, NOW);

    await revokeApiKey(store, "user-2", id!, NOW);

    expect(await verifyApiKey(store, token!, NOW)).not.toBeNull();
  });

  test("updates last use at most once per minute", async () => {
    const store = memoryStore();
    const { token } = await createApiKey(store, "user-1", { name: "ci" }, NOW);

    await verifyApiKey(store, token!, NOW);
    store.rows[0]!.lastUsedAt = NOW;
    await verifyApiKey(store, token!, new Date(NOW.getTime() + 10_000));
    await verifyApiKey(store, token!, new Date(NOW.getTime() + 120_000));

    expect(store.touched).toHaveLength(2);
  });
});

describe("api key management", () => {
  test("lists only the caller's active keys without tokens", async () => {
    const store = memoryStore();
    await createApiKey(store, "user-1", { name: "a" }, NOW);
    const revoked = await createApiKey(store, "user-1", { name: "b" }, NOW);
    await createApiKey(store, "user-2", { name: "c" }, NOW);
    await revokeApiKey(store, "user-1", revoked.id!, NOW);

    const list = await listApiKeys(store, "user-1");

    expect(list.map((key) => key.name)).toEqual(["a"]);
    expect(JSON.stringify(list)).not.toContain("sbx_");
  });

  test.each(["not-a-date", "2020-01-01T00:00:00Z"])("rejects expiresAt %j", async (expiresAt) => {
    await expect(
      createApiKey(memoryStore(), "user-1", { name: "x", expiresAt }, NOW),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

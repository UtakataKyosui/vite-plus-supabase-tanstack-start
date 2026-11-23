import { generateApiKey, type ApiKeyRecord } from "backend";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";
import { authenticate } from "./auth";

const store = vi.hoisted(() => ({
  findByHash: vi.fn(),
  touch: vi.fn(),
  insert: vi.fn(),
  listByUser: vi.fn(),
  revoke: vi.fn(),
}));

vi.mock("./api-key-store", () => ({ apiKeyStore: store }));

const URL_ = "https://app.example.com/api/v1/anything";

function record(hash: string): ApiKeyRecord {
  return {
    id: "key-1",
    userId: "user-1",
    tenantId: null,
    name: "ci",
    prefix: "sbx_",
    hash,
    createdAt: new Date(),
    expiresAt: null,
    lastUsedAt: new Date(),
    revokedAt: null,
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  store.touch.mockResolvedValue(undefined);
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_ANON_KEY", "anon");
});

describe("authenticate with an API key", () => {
  test("returns the principal when the route allows apiKey", async () => {
    const { token, hash } = await generateApiKey();
    store.findByHash.mockResolvedValue(record(hash));

    const result = await authenticate(
      new Request(URL_, { headers: { authorization: `Bearer ${token}` } }),
      ["session", "apiKey"],
      [],
    );

    expect(result).toEqual({
      ok: true,
      principal: { kind: "apiKey", userId: "user-1", apiKeyId: "key-1", tenantId: null },
    });
    expect(store.findByHash).toHaveBeenCalledWith(hash);
  });

  test("rejects a valid key on a session-only route without looking it up", async () => {
    const { token } = await generateApiKey();

    const result = await authenticate(
      new Request(URL_, { headers: { authorization: `Bearer ${token}` } }),
      ["session"],
      [],
    );

    expect(result).toMatchObject({ ok: false });
    expect(result.ok === false && result.response.status).toBe(401);
    expect(store.findByHash).not.toHaveBeenCalled();
  });

  test("does not fall back to the cookie when the key is unknown", async () => {
    const { token } = await generateApiKey();
    store.findByHash.mockResolvedValue(null);

    const result = await authenticate(
      new Request(URL_, {
        headers: { authorization: `Bearer ${token}`, cookie: "sb-x-auth-token=whatever" },
      }),
      ["session", "apiKey"],
      [],
    );

    expect(result.ok === false && result.response.status).toBe(401);
  });

  test.each(["Basic abc", "Bearer", "Bearer not-a-key"])(
    "rejects the Authorization header %j",
    async (authorization) => {
      const result = await authenticate(
        new Request(URL_, { headers: { authorization } }),
        ["session", "apiKey"],
        [],
      );

      expect(result.ok === false && result.response.status).toBe(401);
      expect(store.findByHash).not.toHaveBeenCalled();
    },
  );

  test("does not apply the Origin check to Bearer requests", async () => {
    const { token, hash } = await generateApiKey();
    store.findByHash.mockResolvedValue(record(hash));

    const result = await authenticate(
      new Request(URL_, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, origin: "https://evil.example" },
      }),
      ["apiKey"],
      [],
    );

    expect(result.ok).toBe(true);
  });
});

describe("authenticate with a session", () => {
  test("rejects a foreign origin before touching Supabase", async () => {
    const result = await authenticate(
      new Request(URL_, { method: "DELETE", headers: { origin: "https://evil.example" } }),
      ["session"],
      [],
    );

    expect(result.ok === false && result.response.status).toBe(403);
  });

  test("rejects a request with no credentials", async () => {
    const result = await authenticate(new Request(URL_), ["session", "apiKey"], []);

    expect(result.ok === false && result.response.status).toBe(401);
  });
});

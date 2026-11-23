import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ConfigError, type ApiKeyRecord, type ApiKeyStore, type NewApiKey } from "backend";

interface ApiKeyRow {
  id: string;
  user_id: string;
  tenant_id: string | null;
  name: string;
  prefix: string;
  key_hash: string;
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
}

const TABLE = "api_keys";

function toDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}

function toRecord(row: ApiKeyRow): ApiKeyRecord {
  return {
    id: row.id,
    userId: row.user_id,
    tenantId: row.tenant_id,
    name: row.name,
    prefix: row.prefix,
    hash: row.key_hash,
    createdAt: new Date(row.created_at),
    expiresAt: toDate(row.expires_at),
    lastUsedAt: toDate(row.last_used_at),
    revokedAt: toDate(row.revoked_at),
  };
}

let client: SupabaseClient | undefined;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new ConfigError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function fail(action: string, error: { message: string }): never {
  throw new Error(`api_keys ${action} failed: ${error.message}`);
}

// This client bypasses RLS. Every query below filters on the caller explicitly.
export const apiKeyStore: ApiKeyStore = {
  async findByHash(hash) {
    const { data, error } = await getClient()
      .from(TABLE)
      .select("*")
      .eq("key_hash", hash)
      .maybeSingle<ApiKeyRow>();
    if (error) fail("lookup", error);
    return data ? toRecord(data) : null;
  },

  async touch(id, at) {
    const { error } = await getClient()
      .from(TABLE)
      .update({ last_used_at: at.toISOString() })
      .eq("id", id);
    if (error) fail("touch", error);
  },

  async insert(row: NewApiKey) {
    const { data, error } = await getClient()
      .from(TABLE)
      .insert({
        user_id: row.userId,
        tenant_id: row.tenantId,
        name: row.name,
        prefix: row.prefix,
        key_hash: row.hash,
        expires_at: row.expiresAt?.toISOString() ?? null,
      })
      .select("*")
      .single<ApiKeyRow>();
    if (error) fail("insert", error);
    return toRecord(data);
  },

  async listByUser(userId) {
    const { data, error } = await getClient()
      .from(TABLE)
      .select("*")
      .eq("user_id", userId)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .returns<ApiKeyRow[]>();
    if (error) fail("list", error);
    return data.map(toRecord);
  },

  async revoke(userId, id, at) {
    const { error } = await getClient()
      .from(TABLE)
      .update({ revoked_at: at.toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .is("revoked_at", null);
    if (error) fail("revoke", error);
  },
};

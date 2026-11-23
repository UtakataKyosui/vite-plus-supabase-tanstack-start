create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tenant_id uuid,
  name text not null check (char_length(name) between 1 and 255),
  prefix text not null,
  key_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index api_keys_user_id_idx on public.api_keys (user_id) where revoked_at is null;

-- Only the server (service role) reads and writes this table. Authorization is
-- enforced in the application layer, so no policy is granted to anon or authenticated.
alter table public.api_keys enable row level security;
revoke all on public.api_keys from anon, authenticated;

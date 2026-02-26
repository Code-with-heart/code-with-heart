-- Migration: Create linkedin_accounts table to store LinkedIn OAuth tokens
-- Run this migration with your normal Supabase migration workflow

create table if not exists public.linkedin_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references "user"(id) on delete cascade,
  provider_user_id text,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  scopes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_linkedin_accounts_user_id on public.linkedin_accounts(user_id);
create unique index if not exists idx_linkedin_accounts_provider_user_id on public.linkedin_accounts(provider_user_id);
-- Add unique constraint on user_id to allow upserts (one LinkedIn account per user)
alter table public.linkedin_accounts add constraint unique_user_linkedin_account unique (user_id);

-- Trigger to update updated_at
create or replace function public.trigger_set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_timestamp on public.linkedin_accounts;
create trigger set_timestamp
  before update on public.linkedin_accounts
  for each row execute procedure public.trigger_set_timestamp();

-- Enable RLS
alter table public.linkedin_accounts enable row level security;

-- RLS policies - allow users to manage their own LinkedIn accounts
create policy "Users can manage their own linkedin accounts" on public.linkedin_accounts
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
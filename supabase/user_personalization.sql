create extension if not exists pgcrypto;

create table if not exists public.user_personalization (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  user_email text not null,
  favorite_sources jsonb not null default '[]'::jsonb,
  favorite_topics jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_personalization enable row level security;

create policy if not exists "user_personalization_select_own"
on public.user_personalization
for select
using (auth.uid() = user_id);

create policy if not exists "user_personalization_insert_own"
on public.user_personalization
for insert
with check (auth.uid() = user_id);

create policy if not exists "user_personalization_update_own"
on public.user_personalization
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy if not exists "user_personalization_delete_own"
on public.user_personalization
for delete
using (auth.uid() = user_id);

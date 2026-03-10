-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  dog_name text not null,
  user_name text not null,
  user_email text not null,
  location text not null,
  story text not null,
  social_media text,
  media_urls jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

-- Public can submit entries
create policy if not exists "public can insert submissions"
on public.submissions
for insert
to anon
with check (true);

-- No public reads of submissions table
create policy if not exists "no public select submissions"
on public.submissions
for select
to anon
using (false);

-- Team members (authenticated users) can review submissions
create policy if not exists "team select submissions"
on public.submissions
for select
to authenticated
using (true);

create policy if not exists "team update submissions"
on public.submissions
for update
to authenticated
using (true)
with check (true);

-- Create storage bucket for uploaded media
insert into storage.buckets (id, name, public)
values ('dog-media', 'dog-media', true)
on conflict (id) do nothing;

-- Public can upload to submissions/ path
create policy if not exists "anon upload dog media"
on storage.objects
for insert
to anon
with check (
  bucket_id = 'dog-media'
  and (storage.foldername(name))[1] = 'submissions'
);

-- Public can view media files for approved usage
create policy if not exists "public read dog media"
on storage.objects
for select
to public
using (bucket_id = 'dog-media');

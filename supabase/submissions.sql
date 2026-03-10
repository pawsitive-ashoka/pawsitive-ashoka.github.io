-- Run this in Supabase SQL Editor

create extension if not exists pgcrypto;
create extension if not exists pg_net;

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

create table if not exists public.notification_failures (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid,
  provider text not null default 'resend',
  error_message text not null,
  error_details jsonb,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;
alter table public.notification_failures enable row level security;

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
-- Replace the admin emails below with your final team reviewer list.
drop policy if exists "team select submissions" on public.submissions;
create policy "team select submissions"
on public.submissions
for select
to authenticated
using (
  lower(auth.jwt()->>'email') in (
    'pawsitive@ashoka.edu.in',
    'team@pawsitiveashoka.org'
  )
);

drop policy if exists "team update submissions" on public.submissions;
create policy "team update submissions"
on public.submissions
for update
to authenticated
using (
  lower(auth.jwt()->>'email') in (
    'pawsitive@ashoka.edu.in',
    'team@pawsitiveashoka.org'
  )
)
with check (
  lower(auth.jwt()->>'email') in (
    'pawsitive@ashoka.edu.in',
    'team@pawsitiveashoka.org'
  )
);

-- Only reviewer admins may inspect delivery failures.
create policy if not exists "team select notification failures"
on public.notification_failures
for select
to authenticated
using (
  lower(auth.jwt()->>'email') in (
    'pawsitive@ashoka.edu.in',
    'team@pawsitiveashoka.org'
  )
);

-- Webhook trigger for new submissions.
-- Required database settings (set these once in SQL editor):
-- alter database postgres set app.settings.submission_webhook_url = 'https://<project-ref>.supabase.co/functions/v1/new-submission-notify';
-- alter database postgres set app.settings.submission_webhook_secret = '<same-secret-used-in-edge-function-env>';
create or replace function public.notify_new_submission()
returns trigger
language plpgsql
security definer
as $$
declare
  webhook_url text := current_setting('app.settings.submission_webhook_url', true);
  webhook_secret text := current_setting('app.settings.submission_webhook_secret', true);
begin
  if webhook_url is null or webhook_url = '' then
    return new;
  end if;

  perform net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(webhook_secret, '')
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_new_submission on public.submissions;
create trigger trg_notify_new_submission
after insert on public.submissions
for each row
execute function public.notify_new_submission();

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

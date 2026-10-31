-- SlushyMarkets feedback table.
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run.

create extension if not exists pgcrypto;

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  topic text not null check (topic in ('general', 'lesson-clarity', 'audio', 'bug', 'suggestion')),
  rating smallint check (rating between 1 and 5),
  message text not null check (char_length(message) between 10 and 2000),
  email text check (email is null or char_length(email) <= 254),
  contact_consent boolean not null default false,
  page text check (page is null or char_length(page) <= 200),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300),
  constraint email_needs_consent check (email is null or contact_consent)
);

create index if not exists feedback_created_at_idx on public.feedback (created_at desc);

-- Row Level Security on, with NO policies: the public anon key can neither read nor write.
-- Only the server (service role key, which bypasses RLS) can insert.
-- Read submissions in the Supabase dashboard (Table Editor > feedback).
alter table public.feedback enable row level security;

revoke all on table public.feedback from anon, authenticated;

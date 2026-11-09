-- Learner workspace and community foundation.
-- Additive only: existing learner, lesson, quiz and interview data is untouched.

create table if not exists public.learner_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled note',
  body text not null default '',
  lesson_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists learner_notes_user_updated_idx on public.learner_notes(user_id, updated_at desc);
alter table public.learner_notes enable row level security;
create policy "Learners read own notes" on public.learner_notes for select to authenticated using (auth.uid() = user_id);
create policy "Learners create own notes" on public.learner_notes for insert to authenticated with check (auth.uid() = user_id);
create policy "Learners update own notes" on public.learner_notes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Learners delete own notes" on public.learner_notes for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.community_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  category text not null default 'General',
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_topics_created_idx on public.community_topics(created_at desc);
alter table public.community_topics enable row level security;
create policy "Authenticated learners read community topics" on public.community_topics for select to authenticated using (true);
create policy "Learners create own community topics" on public.community_topics for insert to authenticated with check (auth.uid() = user_id);
create policy "Authors update own community topics" on public.community_topics for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.community_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.community_topics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists community_replies_topic_created_idx on public.community_replies(topic_id, created_at);
alter table public.community_replies enable row level security;
create policy "Authenticated learners read community replies" on public.community_replies for select to authenticated using (true);
create policy "Learners create own community replies" on public.community_replies for insert to authenticated with check (auth.uid() = user_id);

-- Interactive Saviynt labs: learner-owned progress, answers and scores.
-- Additive migration; existing labs and learner records are not modified.
create table if not exists public.lab_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lab_id text not null,
  completed_steps jsonb not null default '[]'::jsonb,
  diagnosis text not null default '',
  score integer not null default 0 check (score between 0 and 100),
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, lab_id)
);
create index if not exists lab_progress_user_updated_idx
  on public.lab_progress(user_id, updated_at desc);
alter table public.lab_progress enable row level security;
drop policy if exists "Learners read own lab progress" on public.lab_progress;
create policy "Learners read own lab progress" on public.lab_progress
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Learners create own lab progress" on public.lab_progress;
create policy "Learners create own lab progress" on public.lab_progress
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Learners update own lab progress" on public.lab_progress;
create policy "Learners update own lab progress" on public.lab_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Learners delete own lab progress" on public.lab_progress;
create policy "Learners delete own lab progress" on public.lab_progress
  for delete to authenticated using (auth.uid() = user_id);

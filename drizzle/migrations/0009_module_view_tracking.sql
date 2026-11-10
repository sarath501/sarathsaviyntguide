-- Record authenticated learner visits to learning modules.
-- Each route entry creates one event. Learners can insert only their own events;
-- administrative reads are performed server-side after the existing admin-role check.

create table if not exists public.module_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null,
  module_title text not null,
  opened_at timestamptz not null default now()
);

create index if not exists module_views_opened_at_idx
  on public.module_views(opened_at desc);
create index if not exists module_views_user_opened_at_idx
  on public.module_views(user_id, opened_at desc);
create index if not exists module_views_module_opened_at_idx
  on public.module_views(module_id, opened_at desc);

alter table public.module_views enable row level security;
grant insert on public.module_views to authenticated;
grant all on public.module_views to service_role;

create policy "Learners record their own module views"
  on public.module_views
  for insert
  to authenticated
  with check (auth.uid() = user_id);

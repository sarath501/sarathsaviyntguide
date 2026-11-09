create table public.connectors (
  id text primary key,
  name text not null,
  category text not null,
  support_type text not null default 'Requires verification',
  difficulty text not null default 'Intermediate',
  summary text not null default '',
  position int not null default 0,
  published boolean not null default true,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index connectors_category_idx on public.connectors(category, position);
grant select on public.connectors to authenticated;
grant insert, update, delete on public.connectors to authenticated;
grant all on public.connectors to service_role;
alter table public.connectors enable row level security;
create policy "read published connectors" on public.connectors for select to authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin insert connectors" on public.connectors for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update connectors" on public.connectors for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "admin delete connectors" on public.connectors for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.connector_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  connector_id text not null references public.connectors(id) on delete cascade,
  sections_done text[] not null default '{}',
  lab_done boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, connector_id)
);
create index connector_progress_user_idx on public.connector_progress(user_id);
grant select, insert, update, delete on public.connector_progress to authenticated;
grant all on public.connector_progress to service_role;
alter table public.connector_progress enable row level security;
create policy "own connector progress" on public.connector_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.connector_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  connector_id text not null references public.connectors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, connector_id)
);
grant select, insert, delete on public.connector_bookmarks to authenticated;
grant all on public.connector_bookmarks to service_role;
alter table public.connector_bookmarks enable row level security;
create policy "own connector bookmarks" on public.connector_bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
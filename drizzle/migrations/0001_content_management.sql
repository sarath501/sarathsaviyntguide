create table public.modules (
  id text primary key,
  num int not null,
  title text not null,
  level text not null default 'Beginner',
  summary text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.modules to anon;
grant select, insert, update, delete on public.modules to authenticated;
grant all on public.modules to service_role;
alter table public.modules enable row level security;
create policy "read published modules" on public.modules for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin insert modules" on public.modules for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update modules" on public.modules for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete modules" on public.modules for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.lessons (
  id text primary key,
  module_id text not null references public.modules(id) on delete cascade,
  position int not null default 0,
  title text not null,
  summary text not null default '',
  points jsonb not null default '[]',
  content jsonb not null default '{}',
  diagram_key text,
  diagram_image_url text,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index lessons_module_idx on public.lessons(module_id, position);
grant select on public.lessons to anon;
grant select, insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "read published lessons" on public.lessons for select to anon, authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin insert lessons" on public.lessons for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update lessons" on public.lessons for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete lessons" on public.lessons for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.labs (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  area text not null default 'General',
  difficulty text not null default 'Intermediate',
  symptom text not null,
  steps jsonb not null default '[]',
  root_cause text not null default '',
  fix text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.labs to authenticated;
grant all on public.labs to service_role;
alter table public.labs enable row level security;
create policy "read labs" on public.labs for select to authenticated using (published or public.has_role(auth.uid(),'admin'));
create policy "admin insert labs" on public.labs for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update labs" on public.labs for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete labs" on public.labs for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
grant select, insert, delete on public.bookmarks to authenticated;
grant all on public.bookmarks to service_role;
alter table public.bookmarks enable row level security;
create policy "own bookmarks" on public.bookmarks for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.profiles add column last_lesson_id text;

create policy "public read diagrams" on storage.objects for select using (bucket_id = 'diagrams');
create policy "admin upload diagrams" on storage.objects for insert to authenticated with check (bucket_id = 'diagrams' and public.has_role(auth.uid(),'admin'));
create policy "admin update diagrams" on storage.objects for update to authenticated using (bucket_id = 'diagrams' and public.has_role(auth.uid(),'admin'));
create policy "admin delete diagrams" on storage.objects for delete to authenticated using (bucket_id = 'diagrams' and public.has_role(auth.uid(),'admin'));
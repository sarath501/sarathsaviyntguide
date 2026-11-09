-- Phase 4: in-app notifications and administrator announcements.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  message text not null check (char_length(message) between 1 and 4000),
  category text not null default 'announcement' check (category in ('announcement','learning','system')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  read_at timestamptz,
  constraint notifications_expiry_after_creation check (expires_at is null or expires_at > created_at)
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);
create index if not exists notifications_broadcast_created_idx
  on public.notifications (created_at desc) where user_id is null;

alter table public.notifications enable row level security;
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;

-- Users can read broadcast messages and notifications addressed to them.
create policy "users read own and broadcast notifications"
  on public.notifications for select to authenticated
  using (user_id is null or user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Only existing administrators can create announcements or notifications.
create policy "admins create notifications"
  on public.notifications for insert to authenticated
  with check (
    public.has_role(auth.uid(), 'admin')
    and created_by = auth.uid()
  );

-- Users can mark only their own targeted notifications as read.
create policy "users mark own notifications read"
  on public.notifications for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Admins can update/delete notification content and remove obsolete announcements.
create policy "admins manage notifications"
  on public.notifications for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

comment on table public.notifications is
  'In-app user notifications and administrator announcements. A null user_id represents a broadcast.';

-- Stage 1 RBAC foundation: permission catalog and role mappings.
-- This migration is additive. It does not modify existing user data, existing
-- RLS policies, or the existing public.has_role(uuid, app_role) function.

create table if not exists public.admin_permissions (
  permission_key text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role public.app_role not null,
  permission_key text not null references public.admin_permissions(permission_key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role, permission_key)
);

alter table public.admin_permissions enable row level security;
alter table public.role_permissions enable row level security;

grant select on public.admin_permissions to authenticated;
grant select on public.role_permissions to authenticated;
grant all on public.admin_permissions to service_role;
grant all on public.role_permissions to service_role;

drop policy if exists "authenticated read admin permissions" on public.admin_permissions;
create policy "authenticated read admin permissions"
  on public.admin_permissions for select to authenticated using (true);

drop policy if exists "admins read role permissions" on public.role_permissions;
create policy "admins read role permissions"
  on public.role_permissions for select to authenticated
  using (public.has_role(auth.uid(), 'admin'::public.app_role)
      or public.has_role(auth.uid(), 'super_admin'::public.app_role));

insert into public.admin_permissions (permission_key, description) values
  ('analytics.view', 'View platform analytics and learning metrics'),
  ('users.view', 'View registered user profiles and activity'),
  ('users.manage_accounts', 'Suspend and restore user accounts'),
  ('users.manage_roles', 'Assign and revoke administrative roles'),
  ('reports.export', 'Export platform reports'),
  ('audit.view', 'View administrator audit history'),
  ('notifications.manage', 'Manage administrative notifications'),
  ('content.manage', 'Create and update learning content'),
  ('system.settings', 'Manage platform-wide settings')
on conflict (permission_key) do update
set description = excluded.description;

-- Existing admins retain useful operational access in the new permission model.
-- Role management and system settings are intentionally reserved for super admins.
insert into public.role_permissions (role, permission_key)
select 'admin'::public.app_role, permission_key
from public.admin_permissions
where permission_key in (
  'analytics.view',
  'users.view',
  'users.manage_accounts',
  'reports.export',
  'audit.view',
  'notifications.manage',
  'content.manage'
)
on conflict do nothing;

create or replace function public.is_super_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $
  select case
    -- Authenticated callers may only inspect their own privileges. Trusted
    -- service-role server operations may evaluate another user's privileges.
    when auth.role() = 'authenticated' and auth.uid() is distinct from _user_id then false
    when auth.role() not in ('authenticated', 'service_role') then false
    else exists (
      select 1
      from public.user_roles
      where user_id = _user_id
        and role = 'super_admin'::public.app_role
    )
  end;
$;

create or replace function public.has_permission(_user_id uuid, _permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $
  select case
    -- Keep this guard here as well: callers can invoke has_permission directly
    -- without first passing through is_super_admin.
    when auth.role() = 'authenticated' and auth.uid() is distinct from _user_id then false
    when auth.role() not in ('authenticated', 'service_role') then false
    else
      public.is_super_admin(_user_id)
      or exists (
        select 1
        from public.user_roles ur
        join public.role_permissions rp on rp.role = ur.role
        where ur.user_id = _user_id
          and rp.permission_key = _permission_key
      )
  end;
$;

revoke all on function public.is_super_admin(uuid) from public;
revoke all on function public.has_permission(uuid, text) from public;
grant execute on function public.is_super_admin(uuid) to authenticated, service_role;
grant execute on function public.has_permission(uuid, text) to authenticated, service_role;

comment on table public.admin_permissions is
  'Permission catalog for administrative capabilities. Changes are managed by trusted server-side operations.';
comment on table public.role_permissions is
  'Role-to-permission mappings. Direct writes by authenticated clients are not granted.';
comment on function public.has_permission(uuid, text) is
  'Returns whether a user has a permission through their assigned role. Super admins implicitly have all permissions.';

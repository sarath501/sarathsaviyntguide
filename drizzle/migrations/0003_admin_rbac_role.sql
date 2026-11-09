-- Stage 1 RBAC foundation.
-- Add the new role as an additive enum change. Keep this in its own migration:
-- PostgreSQL does not allow a newly-added enum value to be used until the
-- transaction that adds it has committed.
alter type public.app_role add value if not exists 'super_admin';

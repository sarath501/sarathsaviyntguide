# Admin RBAC foundation — Stage 1

## Scope

This stage introduces the database foundation for granular administrative authorization:

- Adds the `super_admin` value to the existing `public.app_role` enum.
- Adds `admin_permissions` and `role_permissions`.
- Adds `public.is_super_admin(uuid)` and `public.has_permission(uuid, text)`.
- Seeds a permission catalog and a conservative baseline permission set for existing admins.
- Does not change existing content-management policies or existing user records.
- Does not assign the super-admin role to any account.

## Migration order

Apply only after confirming the target Supabase project is the same backend used by the deployed Lovable app and that the existing base migrations are present:

1. `0003_admin_rbac_role.sql`
2. `0004_admin_rbac_permissions.sql`

Do not run these migrations against an unverified or empty Supabase project. The application currently depends on the existing `app_role`, `profiles`, `user_roles`, `has_role`, and learning tables from migrations 0000–0002.

## Initial Super Admin bootstrap

No account is promoted by this change. Before bootstrap:

1. Confirm the correct production Supabase project.
2. Identify the existing administrator account by its Auth user UUID in the Supabase dashboard.
3. Verify that this is the account controlled by the platform owner.
4. Use a reviewed, one-time privileged operation to insert the `super_admin` role for that UUID.
5. Verify `public.is_super_admin('<verified-user-uuid>')` returns true.
6. Remove or disable the one-time bootstrap mechanism.

Never place service-role credentials in browser code, Git, SQL shared publicly, or chat. Do not promote an account based only on an email supplied by a browser request.

## Security notes

- Authenticated users receive read-only access to the permission catalog and role mappings.
- Authenticated users receive no direct write grants on either RBAC table.
- Role/permission changes must be implemented in protected server-side functions with explicit authorization and audit logging.
- Existing `has_role(..., 'admin')` checks remain valid; this stage does not silently convert legacy authorization checks.
- Super Admin is not assigned until the production owner explicitly approves the bootstrap.


## Function caller boundary

Authenticated callers may evaluate only their own privileges; requests naming
another user return false. Trusted service-role server operations may evaluate
a target user's privileges after independently authorizing the operation.
Calls without an authenticated or service-role JWT role return false. The
identity guard is enforced independently in both helper functions.

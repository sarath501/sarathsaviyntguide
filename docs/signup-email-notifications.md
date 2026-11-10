# New signup email notifications

This feature sends one email to the portal owner when a new row is inserted into Supabase Auth's `auth.users` table. It does not replace or modify Lovable's existing `no-reply@auth.lovable.cloud` verification email.

## Cost

Resend currently lists a Free plan with 3,000 emails/month and a 100-email daily limit. Check the current plan and restrictions before enabling it: https://resend.com/pricing

The code defaults to Resend's `onboarding@resend.dev` test sender. Test-sender restrictions may limit recipients. For ongoing delivery to an arbitrary inbox or a branded sender, Resend may require a domain you control and have verified. Do not purchase a domain just for initial testing.

## 1. Create a Resend API key

1. Create a free account at https://resend.com/
2. Create an API key in the Resend dashboard.
3. Keep the key private. Never add it to GitHub, frontend code, or chat.

## 2. Deploy the Edge Function

Deploy `supabase/functions/notify-new-signup/index.ts` to the same Supabase/Lovable Cloud project used by the live portal, with function name `notify-new-signup`.

The function has JWT verification disabled in `supabase/config.toml`, but independently checks the `x-signup-webhook-secret` header. Do not remove that check.

In the Supabase Dashboard, open Edge Functions → Secrets and add:

- `RESEND_API_KEY`: the API key from Resend
- `SIGNUP_WEBHOOK_SECRET`: a long random secret (at least 32 random characters)
- `SIGNUP_NOTIFICATION_EMAIL`: `avalasarath01@gmail.com`

Optional:
- `SIGNUP_NOTIFICATION_FROM`: keep the default `Sarath IGA Portal <onboarding@resend.dev>` for initial testing. For a verified sender domain, set a sender address on that domain.

## 3. Enable pg_net

In the Supabase Dashboard, open Database → Extensions and enable `pg_net` if it is not already enabled. Confirm Vault is available.

## 4. Store the project URL and webhook secret in Vault

Open the SQL Editor for the **same active Lovable Cloud project used by the portal**. Run these statements once, replacing the placeholders. Use the exact same random secret you set as `SIGNUP_WEBHOOK_SECRET` in Edge Function secrets.

```sql
select vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'signup_notification_project_url'
);

select vault.create_secret(
  'PASTE_THE_SAME_LONG_RANDOM_SECRET_HERE',
  'signup_notification_webhook_secret'
);
```

Do not use the unrelated personal Supabase project unless you have confirmed it is the live portal backend.

## 5. Create the signup trigger

Run this SQL once in that same project's SQL Editor:

```sql
create or replace function public.notify_admin_of_new_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  webhook_secret text;
begin
  select decrypted_secret
    into project_url
    from vault.decrypted_secrets
    where name = 'signup_notification_project_url'
    limit 1;

  select decrypted_secret
    into webhook_secret
    from vault.decrypted_secrets
    where name = 'signup_notification_webhook_secret'
    limit 1;

  if project_url is null or webhook_secret is null then
    raise warning 'Signup notification secrets are not configured; skipping email.';
    return new;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/notify-new-signup',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-signup-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'users',
      'schema', 'auth',
      'record', jsonb_build_object(
        'id', new.id,
        'email', new.email,
        'created_at', new.created_at,
        'email_confirmed_at', new.email_confirmed_at,
        'raw_user_meta_data', new.raw_user_meta_data
      ),
      'old_record', null
    )
  );

  return new;
exception
  when others then
    -- Notification failures must never prevent a learner from signing up.
    raise warning 'Signup notification could not be queued: %', sqlerrm;
    return new;
end;
$$;

revoke all on function public.notify_admin_of_new_signup() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_notify_admin on auth.users;

create trigger on_auth_user_created_notify_admin
after insert on auth.users
for each row
execute function public.notify_admin_of_new_signup();
```

The trigger sends only the learner's ID, email, signup timestamp, verification timestamp and signup metadata. It does not send password hashes or other auth fields. It uses asynchronous `pg_net`, and any notification error is caught so signup itself can continue.

## 6. Test

1. Register a new test account using an email address you control.
2. Confirm the existing Lovable verification email still arrives as before.
3. Check `avalasarath01@gmail.com` for a separate subject: **New learner registered – Sarath IGA Learning Portal**.
4. The notification indicates whether email verification is pending or already confirmed at the moment of signup.

If the notification does not arrive, inspect the Edge Function logs and the `net._http_response` table in the active project. A successful HTTP request to Resend is not the same as inbox delivery; also check the Resend Emails dashboard.

## Safety and cleanup

- Do not put API keys or webhook secrets in source control.
- The notification is sent only to the configured portal-owner inbox, not to the new learner.
- Existing Lovable verification emails are unchanged.
- If you disable this feature, drop only the `on_auth_user_created_notify_admin` trigger and the `public.notify_admin_of_new_signup()` function. Do not remove the existing `on_auth_user_created` profile/role trigger.

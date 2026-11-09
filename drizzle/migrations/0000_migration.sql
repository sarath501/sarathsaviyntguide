create type public.app_role as enum ('admin','user');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  experience_level text not null default 'Beginner',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own roles read" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, experience_level)
  values (new.id, new.raw_user_meta_data->>'full_name', coalesce(new.raw_user_meta_data->>'experience_level','Beginner'));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id text not null,
  module_id text not null,
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
grant select, insert, delete on public.lesson_progress to authenticated;
grant all on public.lesson_progress to service_role;
alter table public.lesson_progress enable row level security;
create policy "own progress" on public.lesson_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  explanation text not null default '',
  difficulty text not null default 'Intermediate',
  is_certification boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.quiz_questions to authenticated;
grant all on public.quiz_questions to service_role;
alter table public.quiz_questions enable row level security;
create policy "read questions" on public.quiz_questions for select to authenticated using (true);
create policy "admin insert q" on public.quiz_questions for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "admin update q" on public.quiz_questions for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete q" on public.quiz_questions for delete to authenticated using (public.has_role(auth.uid(),'admin'));

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  module_id text not null,
  score int not null,
  total int not null,
  is_certification boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.quiz_attempts to authenticated;
grant all on public.quiz_attempts to service_role;
alter table public.quiz_attempts enable row level security;
create policy "own attempts read" on public.quiz_attempts for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "own attempts insert" on public.quiz_attempts for insert to authenticated with check (auth.uid() = user_id);

create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  topic text not null,
  level text not null,
  transcript jsonb not null default '[]',
  score int,
  feedback text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.interviews to authenticated;
grant all on public.interviews to service_role;
alter table public.interviews enable row level security;
create policy "own interviews read" on public.interviews for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "own interviews insert" on public.interviews for insert to authenticated with check (auth.uid() = user_id);
create policy "own interviews update" on public.interviews for update to authenticated using (auth.uid() = user_id);

insert into public.quiz_questions (module_id, question, options, correct_index, explanation, difficulty, is_certification) values
('m1','What does the "Leaver" process in JML primarily ensure?','["New accounts are created","Access is revoked when a person exits","Roles are re-certified","Passwords are rotated"]',1,'Leaver processing removes or disables all access promptly when an identity leaves to prevent orphan accounts.','Beginner',false),
('m1','Authentication answers which question?','["What can you do?","Who are you?","When can you log in?","Which roles exist?"]',1,'Authentication verifies identity; authorization decides what that identity may do.','Beginner',true),
('m1','Least privilege means:','["Everyone gets read access","Users get only the access needed for their job","Admins have no access","Access expires daily"]',1,'Grant the minimum access required for the task.','Beginner',true),
('m2','In Saviynt EIC, an Endpoint represents:','["A physical server only","A target system/application where accounts and entitlements live","A user group","A workflow step"]',1,'Endpoints model the target application; connections define how EIC talks to it.','Beginner',true),
('m2','Identity correlation is used to:','["Encrypt passwords","Link imported accounts to the right identity","Generate reports","Approve requests"]',1,'Correlation rules match accounts to users, typically by an attribute such as employee ID or email.','Intermediate',true),
('m2','Which object directly grants permissions inside a target app?','["Identity","Entitlement","Endpoint","Security system"]',1,'Entitlements (groups, roles, permissions) are assigned to accounts.','Beginner',false),
('m3','During application onboarding, what usually comes FIRST?','["Production deployment","Requirement gathering and data analysis","Hypercare","Certification campaign"]',1,'Gather requirements and analyze source data before configuring connections.','Beginner',false),
('m3','An account import completes but accounts show as orphan. Most likely cause?','["Wrong workflow","Correlation rule not matching","Certification not launched","SoD rule active"]',1,'Orphans indicate accounts were not correlated to identities.','Intermediate',true),
('m3','What is Hypercare?','["Pre-sales demo","Stabilization support period after go-live","A connector type","A role type"]',1,'Hypercare is heightened post-go-live support.','Beginner',false),
('m4','Which connector is typically used for Active Directory?','["REST connector","LDAP/AD connector","DB connector","SAP connector"]',1,'AD is integrated with the AD/LDAP connector.','Beginner',true),
('m4','For a SaaS app exposing JSON APIs, the best fit is usually:','["REST connector","Flat file only","SAP connector","LDAP connector"]',0,'The REST connector with JSON configs (ConnectionJSON, ImportAccountEntJSON) handles API-based apps.','Intermediate',true),
('m4','A DB connector import query returns nothing. First thing to check?','["Approval workflow","The SQL query and DB credentials/connectivity","Certification config","Role owner"]',1,'Validate connectivity and run the query directly against the database.','Intermediate',false),
('m5','A parallel approval workflow means:','["Approvers act one after another","All approvers receive the request at the same time","No approval is needed","Only the manager approves"]',1,'Parallel workflows send to multiple approvers simultaneously.','Intermediate',true),
('m5','Request approved but not provisioned. Where to look first?','["Certification history","Pending tasks / provisioning job and connector logs","SoD rules","Analytics"]',1,'Check pending tasks and provisioning job status plus connector logs.','Intermediate',true),
('m5','Birthright access is typically granted:','["By manual request","Automatically based on identity attributes","Only by admins","During certification"]',1,'Birthright rules assign baseline access on joiner events.','Beginner',false),
('m6','In a user manager certification, who reviews access?','["The application owner","The user''s manager","The user","The auditor"]',1,'Manager certifications have managers attest their direct reports'' access.','Beginner',true),
('m6','What happens when a reviewer revokes access in a certification?','["Nothing until next year","A revoke task is created for remediation","The user is deleted","The role is deleted"]',1,'Revocations create remediation (deprovisioning) tasks.','Intermediate',true),
('m6','A micro-certification is triggered by:','["A yearly schedule only","An event such as a job change","Login","Password reset"]',1,'Event-based micro-certs review access when risk-relevant events occur.','Advanced',false),
('m7','Role mining is used to:','["Delete roles","Discover candidate roles from existing access patterns","Approve requests","Reset passwords"]',1,'Role mining analyzes access data to suggest roles.','Intermediate',true),
('m7','An enterprise role usually:','["Maps to one entitlement in one app","Bundles access across multiple applications","Only exists in AD","Cannot be requested"]',1,'Enterprise roles group access spanning applications.','Intermediate',false),
('m7','Role explosion refers to:','["Too few roles","An unmanageable number of overly specific roles","Role deletion","Role certification"]',1,'Creating too many narrow roles defeats RBAC.','Advanced',false),
('m8','A classic SoD conflict example:','["Read report + view dashboard","Create vendor + approve vendor payment","Login + logout","Reset own password"]',1,'Allowing one person to create and pay vendors enables fraud.','Beginner',true),
('m8','A mitigating control is used when:','["The conflict is removed","A business-accepted SoD conflict needs compensating oversight","An account is orphaned","A role is mined"]',1,'Mitigating controls reduce risk for accepted violations.','Intermediate',true),
('m8','Preventive SoD checks run:','["After provisioning","During the access request before approval","Only in certifications","Yearly"]',1,'Preventive checks flag conflicts at request time.','Intermediate',false),
('m9','Which SQL finds users without any account?','["SELECT * FROM users WHERE 1=0","SELECT u.* FROM users u LEFT JOIN accounts a ON ... WHERE a.accountkey IS NULL","SELECT * FROM accounts","DELETE FROM users"]',1,'LEFT JOIN with IS NULL finds identities lacking related rows.','Intermediate',true),
('m9','Orphan accounts are accounts that:','["Belong to admins","Are not linked to any identity","Are disabled","Have no entitlements"]',1,'Orphans have no correlated owner.','Beginner',true),
('m9','In Saviynt analytics, a runtime analytics control is mainly used to:','["Configure connectors","Run SQL-based reports/controls on EIC data","Approve requests","Rotate keys"]',1,'Analytics run SQL queries against EIC data for reports and controls.','Intermediate',false),
('m10','Which job type brings account data from a target into EIC?','["Provisioning job","Import job (account/entitlement import)","Certification job","Email job"]',1,'Import jobs pull data from target systems.','Beginner',true),
('m10','Email templates in Saviynt are commonly used to:','["Store passwords","Notify approvers and users of workflow events","Run SQL","Define roles"]',1,'Templates drive notifications.','Beginner',false),
('m10','User update rules can automatically:','["Approve SoD violations","Trigger actions when identity attributes change","Delete endpoints","Create connectors"]',1,'Rules react to attribute changes (e.g. mover events).','Intermediate',true),
('m11','PAM primarily governs:','["Standard user email","Privileged/admin accounts and sessions","Printer access","Guest Wi-Fi"]',1,'Privileged Access Management secures elevated accounts.','Intermediate',true),
('m11','Zero Trust emphasizes:','["Trust inside the network","Continuous verification of every access request","No authentication","Shared accounts"]',1,'Never trust, always verify.','Intermediate',false),
('m11','Just-in-time access means:','["Permanent admin rights","Time-bound elevated access granted only when needed","Access granted at hire","Access never expires"]',1,'JIT reduces standing privilege.','Advanced',true);
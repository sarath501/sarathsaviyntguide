# Sarath IGA Learning Portal — Enhancement Roadmap

## Objective
Extend the existing Saviynt/IAM/IGA learning portal with analytics, richer user administration, reporting, notifications, mock exams, interview practice, learning paths, certificates, advanced labs, and a searchable knowledge base.

## Non-negotiable constraints
- Preserve the existing application, routes, visual language, authentication, admin dashboard, users, profiles, modules, lessons, questions, quizzes, labs, connectors, bookmarks, interviews, and progress data.
- Do not introduce RBAC, Super Admin, granular permission catalogs, or a replacement authorization model. Continue using the existing `has_role(..., 'admin')` administrator check.
- Do not use Lovable AI credits.
- Do not execute production SQL, change production data, or publish/deploy without explicit user approval.
- Work on this feature branch and use reviewable pull requests. Do not merge without explicit approval.
- Prefer additive, backward-compatible changes. Any schema change must have a reviewed migration, RLS policies, rollback notes, and a non-production validation plan before approval.
- Keep privileged Supabase service-role operations server-side only. Validate inputs and enforce ownership/admin authorization on the server.

## Repository baseline inspected
- React 19 + TypeScript + TanStack Start/Router + Vite.
- Supabase client and server-side auth middleware.
- React Query for data fetching and caching.
- Recharts is already installed.
- Existing admin route: `src/routes/_authenticated/admin.tsx`.
- Existing admin user analytics server function: `src/lib/admin.functions.ts`.
- Existing admin authorization hook: `src/hooks/use-auth.ts`, using `has_role(user.id, 'admin')`.
- Existing data includes profiles, user_roles, lesson_progress, quiz_questions, quiz_attempts, interviews, labs, connectors, connector_progress, bookmarks, modules and lessons.
- Existing migrations are `0000_migration.sql`, `0001_content_management.sql`, and `0002_connectors_learning_center.sql`.

## Delivery phases

### Phase 0 — Baseline and safety (current)
- Establish this isolated feature branch.
- Record architecture, existing tables, constraints, and delivery sequence.
- Verify branch builds, lint/tests, route and data dependencies before feature work.
- No production database or deployment operations.

### Phase 1 — Analytics
- Admin KPI cards and time-series charts for registrations, active learners, lesson completion, quiz attempts/pass rate, average score, connector/lab engagement and interview activity.
- Date-range filters and clear empty/loading/error states.
- Reuse existing tables first; avoid new tables where existing data is sufficient.
- Ensure metrics are defined accurately (e.g. active user window and completion denominator).

### Phase 2 — User management
- Search/filter/sort and pagination.
- User detail view with profile, learning progress, quiz history, interview/lab/connector activity and registration/login metadata where available.
- Account actions only after server-side authorization, confirmation UX, auditability and verification of Supabase Auth behavior.
- No role-management UI and no RBAC.

### Phase 3 — Reports and exports
- CSV first; spreadsheet/PDF options where technically justified.
- Date filters, report definitions, consistent timezone/column labels, safe handling of personal data.
- Exports must respect the same admin authorization and avoid exposing secrets.

### Phase 4 — Notifications
- In-app notification inbox, read/unread state, announcement targeting and dismiss/archive behavior.
- Start with in-app notifications; email/push delivery requires separate provider/configuration approval.
- Add schema only after migration/RLS design and approval.

### Phase 5 — Mock exams
- Timed exam sessions, configurable question count/difficulty/topic, randomized selection, scoring, explanations and attempt history.
- Never expose correct answers before submission.
- Reuse quiz question bank where possible; distinguish practice quiz and exam semantics.

### Phase 6 — Interview practice
- Structured Saviynt, SailPoint and IAM scenario tracks; question sets, response capture, rubric-based feedback and history.
- AI-generated feedback requires an approved provider/key and cost/privacy review; provide deterministic rubric feedback as a no-AI baseline.
- Do not represent automated scoring as a hiring decision.

### Phase 7 — Learning paths
- Beginner/intermediate/advanced tracks, prerequisites, recommended next lessons and progress indicators.
- Build on modules, lessons, bookmarks and progress; do not rewrite existing course content.

### Phase 8 — Certificates
- Defined completion rules, unique certificate IDs, issue date and learner/course details.
- Downloadable certificate and public verification view with minimal disclosed data.
- Avoid issuing certificates retroactively until criteria are agreed.

### Phase 9 — Advanced labs
- Scenario-based IAM/IGA labs, hints, validation/checkpoints and completion tracking.
- No execution of real privileged commands or connection to production systems.
- Reuse current labs and add structured content progressively.

### Phase 10 — Knowledge base
- Searchable articles, categories, tags, error codes, root causes, resolutions and related labs/lessons.
- Start with curated static content and database-backed publishing only after approval.
- Include source/verification date for technical guidance.

## Engineering and acceptance gates
Each phase must include:
1. A phase-specific implementation branch/PR or a clearly isolated commit series.
2. Server-side authorization and input validation.
3. RLS/ownership review for any data access or schema change.
4. Loading, empty, error, responsive and accessibility states.
5. Tests plus build/lint checks where the repository environment permits.
6. A preview verification checklist.
7. Explicit user approval before merging, applying production migrations, or publishing.

## Current status
- Roadmap branch created from current `main`.
- This commit records the plan only.
- No application code, database schema, production data, or deployment has been changed.

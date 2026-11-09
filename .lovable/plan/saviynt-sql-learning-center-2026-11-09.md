# Saviynt SQL Learning Center

## Preserve and extend
Upgrade the existing SQL Practice area into **Saviynt SQL Learning Center – Query Library & Hands-on Practice Lab**, retaining `/sql`, all existing portal features, accounts, learning content, and progress. Preserve the seven existing exercise IDs and migrate browser-held completions into the signed-in learner's stored progress without inventing assessment scores.

## Inspection findings
- The current SQL area uses browser-based SQLite, seven exercises, result checking, hints, solutions, and the existing AI tutor.
- SQL exercises and completions are not currently stored in the portal database; completions are held in the browser.
- The portal database already has real authentication roles and learning tables. Training tables must not replace or collide with these, especially `user_roles`.
- No separate PostgreSQL training connection is currently available.

## Required setup
Connect a **separate PostgreSQL database containing only fictional training data**, with a dedicated least-privilege learner role. A separate schema inside the portal database is not an acceptable substitute. Connection setup may require an external account and provider charges; confirm these before setup. Keep the current SQL lab working until the replacement is tested.

## Phased delivery
1. **Training data:** Create the 17 requested relational training tables in the isolated database, including keys, indexes, statuses and realistic fictional cases. Include conflicts spread across multiple accounts, orphan accounts, terminated users with active access, failed jobs, and unfinished reviews. Validate relationships and representative reports.
2. **Canonical library:** Store the 11 categories and at least 100 genuinely distinct exercises as editable portal content. Reuse the seven existing business requirements. Include explanations, expected results, practical scenarios, interview discussions, common mistakes, alternatives, and related concepts. Validate every reference query against the actual training data. Reject duplicate IDs, normalized requirements, and equivalent query logic before publishing.
3. **Dashboard and library:** Add real counts, category/difficulty filters, search, recent practice, progress, bookmarks, scores and recommendations. Keep the existing SQL navigation destination; add dedicated exercise detail pages with previous/next links.
4. **Playground:** Add a syntax-highlighted editor with line numbers and schema autocomplete; execute actual PostgreSQL queries. Provide sortable/searchable/paginated results, execution timing, errors, reset/clear/copy/save controls and query history.
5. **Learning and Challenge modes:** Learning shows explanations and optional solutions. Challenge initially shows only the requirement, then compares submitted result sets rather than SQL text. Report score, missing and unexpected rows; unlock hints, solutions and explanation after submission. Compare duplicate rows and null values correctly.
6. **Explorer:** Show all 17 tables, descriptions, column types, keys, sample records, and selectable relationships in a zoomable ER diagram.
7. **Tutor and interview preparation:** Extend the existing authenticated AI system with explanation levels and SQL coaching. Keep synthetic-schema examples clearly labeled; link interview discussions to canonical exercises rather than duplicating them. Do not claim examples are official Saviynt tenant SQL.
8. **Progress and Admin:** Store attempts, scores, practice duration, saved queries, bookmarks and history per user. Derive streaks, category/difficulty performance and weak-area recommendations from actual activity. Extend the existing Admin area for categories, exercises, publishing, expected results and learner performance. Dataset uploads require structural validation and preview before privileged import into the separate training database; learner access remains read-only.

## Technical implementation
- Keep portal content and learner records in Lovable Cloud with explicit grants and RLS: users access their own records; existing server-validated admins manage content and review permitted performance data.
- Use authenticated TanStack server functions for execution and assessment; use the existing bearer middleware and AI entry points. Never expose credentials or accept a user-supplied database destination.
- Parse PostgreSQL into an AST server-side. Permit exactly one approved read-only statement, including safe CTEs. Reject write CTEs, system catalogs, unauthorized schemas, locking clauses, and non-allowlisted functions. Validation supplements—not replaces—the database role's restrictions.
- Execute in a read-only transaction with a five-second statement timeout and a 500-row result cap, plus bounded query length and response size. Reject capped/incomplete assessment results rather than falsely marking them correct.
- Apply library and learner schema changes additively. Initialize actual training records only in the isolated database, not at page load. Store expected results with a dataset version and invalidate assessments when an administrator changes that version.
- Add focused tests for read-only enforcement, single statements, schema/function restrictions, limits, duplicate prevention, identity-wide SoD, scoring, and learner isolation.

## Acceptance and rollout
Test each phase before proceeding. Run all canonical queries, test wrong and correct submissions, and verify a signed-in learner's saved activity reads back. Verify Admin restrictions and attack inputs, and inspect desktop/mobile layouts. Publish only after the replacement is ready and security checks pass.

**Dependency:** Server-side PostgreSQL execution cannot be completed until a separate training database and restricted connection are configured; do not silently substitute the production database or browser SQLite.
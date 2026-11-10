# Interactive Saviynt Implementation Lab

## Purpose

Add a guided, interactive learning area where portal learners practise common Saviynt IGA implementation concepts using fictional scenarios. This is a learning simulator only; it must never connect to or modify a live Saviynt, Active Directory, SAP, HR, or other enterprise system.

## Learner experience

Each lab follows the same sequence:

1. Learning objective and prerequisite concepts.
2. Fictional business scenario.
3. Clear, numbered task instructions.
4. Interactive practice area.
5. Validate, Hint, Reset, and Show Solution actions.
6. Result feedback explaining both correct and incorrect choices.
7. Completion status and score.

## Initial lab catalogue

### 1. Application Onboarding
Practise a fictional Active Directory application onboarding scenario: application details, connection profile fields, account attributes, entitlement attributes, and configuration validation. Use clearly labelled dummy values only.

### 2. Identity Mapping
Map fictional HR source fields to identity attributes, including employee ID, email, department, manager, and worker status. Include a missing-manager troubleshooting challenge.

### 3. Access Request
Simulate an employee requesting a fictional SAP Finance entitlement, business justification, manager approval, application-owner approval, and a simulated provisioning outcome.

### 4. Workflow Builder
Create a simplified approval flow from predefined blocks: start, manager approval, owner approval, condition, approved path, rejected path, and end. This is a conceptual builder, not a reproduction of Saviynt's workflow engine.

### 5. Access Certification
Review fictional employee-entitlement rows and choose Retain or Revoke with a justification. Show retained, revoked, and pending totals.

### 6. Segregation of Duties (SoD)
Identify a fictional conflict such as Payment Creator plus Payment Approver, explain the risk, and select a mitigation action.

## Difficulty levels

- Beginner: guided tasks with explicit instructions and hints.
- Intermediate: multi-step configuration and diagnosis.
- Advanced: scenario-based implementation and support challenges.

## Shared lab controls

- Validate: evaluate the learner's current selections/configuration against authored expected results.
- Hint: reveal progressive clues without immediately giving away the solution.
- Reset: restore the initial exercise state.
- Show Solution: reveal the expected configuration and explanation.
- Score: award points only for validated task outcomes; do not fabricate learner progress.
- Accessibility: keyboard-operable controls, visible focus, labelled fields, and responsive layouts.

## Navigation and dashboard

Add an Interactive Learning Lab entry with:
- Lab Dashboard
- Application Onboarding
- Identity Mapping
- Access Request
- Workflow Builder
- Access Certification
- SoD Lab
- My Achievements

The dashboard should show only real learner progress. Do not display fabricated totals or percentages. If no progress data is available, show an honest empty state.

## Data and architecture constraints

The repository's AGENTS.md states that learning content (modules, lessons, labs, and quiz questions) lives in the database and is edited through the Admin page. Do not hardcode the learning library in React components.

The same project instructions prohibit manually adding or editing `supabase/migrations/` and `drizzle/` files; schema changes must be requested through Lovable. Therefore:

- Reuse an existing supported lab/content data model if it already represents the required exercises.
- If the existing schema cannot represent the lab catalogue, pause that portion and request the required schema/content changes through Lovable; do not invent a client-side substitute or add a migration.
- Keep any exercise runtime and validation isolated from the portal database's privileged credentials.
- No new paid APIs, AI calls, or external integrations are required for the first release.
- Never store real credentials, tokens, personal employee data, or connection secrets.
- All identities, applications, entitlements, and outcomes must be fictional.
- Do not change authentication, roles, permissions, or unrelated portal features.

## Delivery and acceptance

Implement in small, reviewable increments. First verify the existing route/navigation patterns and the Admin-managed content model. Then implement the dashboard and the first two interactive labs using the supported model. Add the remaining four labs after the content model is confirmed.

Acceptance checks:
- All six lab entries are discoverable.
- Each implemented lab has an objective, scenario, instructions, practice interaction, validation, explanation, and reset.
- Hints and solution reveal work.
- Scores and progress reflect actual learner actions only.
- Empty/loading/error states are clear.
- Mobile and desktop layouts work.
- Existing portal routes and features remain unchanged.
- No database migrations, production integrations, secret values, or unrelated access-control changes are introduced.

## Review note

This document is an implementation plan. It does not claim that the interactive lab UI, database content, or learner progress tracking has already been implemented. The draft pull request should remain open for review until the supported content model and first working implementation are verified.

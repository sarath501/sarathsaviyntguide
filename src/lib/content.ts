export type Lesson = { id: string; title: string; body: string; points: string[] };
export type Module = { id: string; num: number; title: string; level: string; summary: string; lessons: Lesson[] };

const L = (mid: string, i: number, title: string, body: string, points: string[]): Lesson => ({
  id: `${mid}-l${i}`,
  title,
  body,
  points,
});

export const MODULES: Module[] = [
  {
    id: "m1", num: 1, title: "IAM & IGA Fundamentals", level: "Beginner",
    summary: "Core identity concepts every IGA engineer must master.",
    lessons: [
      L("m1", 1, "Introduction to IAM", "Identity and Access Management is the discipline of ensuring the right people and machines have the right access to the right resources, at the right time, for the right reasons. It spans identity stores, authentication, authorization, provisioning and governance.", ["Identities can be human (employees, contractors) or non-human (service accounts, bots)", "IAM reduces breach risk and supports audit compliance", "Governance (IGA) and access (AM) are complementary"]),
      L("m1", 2, "Authentication vs Authorization", "Authentication proves who you are (passwords, MFA, SSO). Authorization decides what you may do once identified (roles, entitlements, policies). IGA mostly governs authorization: who holds which entitlements and whether they should.", ["AuthN = identity proof; AuthZ = permission decision", "SSO/MFA live in access management tools", "Entitlements are the unit IGA governs"]),
      L("m1", 3, "Identity Governance & Administration", "IGA combines identity lifecycle administration (provisioning, deprovisioning) with governance (access reviews, SoD, policy, reporting). Platforms like Saviynt EIC centralize identities, accounts and entitlements from every application.", ["Administration = automate access changes", "Governance = prove access is appropriate", "Single source of truth for 'who has access to what'"]),
      L("m1", 4, "Joiner, Mover, Leaver", "JML processes driven by an authoritative source (usually HR) automate access across the identity lifecycle. Joiners receive birthright access, movers gain new and lose old access, and leavers have all access revoked promptly.", ["HR (e.g. Workday, SuccessFactors) is typically authoritative", "Movers are the most common source of privilege creep", "Leaver delays create orphan accounts — a top audit finding"]),
      L("m1", 5, "Least Privilege & Zero Trust", "Least privilege grants only the access needed for a task. Zero Trust assumes no implicit trust and verifies every request continuously. IGA enforces both through role design, time-bound access and regular certification.", ["Remove standing privilege where possible", "Use just-in-time elevation for admin tasks", "Certify access regularly to catch drift"]),
      L("m1", 6, "Governance & Compliance", "Regulations such as SOX, HIPAA, GDPR and PCI-DSS require organizations to control and evidence access. IGA provides audit trails, certification evidence and SoD reports that auditors rely on.", ["SOX focuses on financial system access & SoD", "Evidence = who approved, when, and why", "Automated reports reduce audit effort"]),
    ],
  },
  {
    id: "m2", num: 2, title: "Saviynt EIC Fundamentals", level: "Beginner",
    summary: "Architecture and data model of Saviynt Enterprise Identity Cloud.",
    lessons: [
      L("m2", 1, "Introduction to Saviynt EIC", "Saviynt Enterprise Identity Cloud is a cloud-native converged identity platform covering IGA, application access governance, privileged access and third-party access. It is delivered as SaaS and integrates with on-prem systems through connectors and a connector gateway.", ["Converged IGA + PAM + app GRC", "SaaS delivery, multi-tenant cloud", "On-prem reach via connector gateway/agents"]),
      L("m2", 2, "EIC Architecture", "Core layers: the identity warehouse (users, accounts, entitlements), the connector framework, workflow and rules engines, certification and analytics modules, and the request/self-service UI. Jobs move data between EIC and target systems.", ["Identity warehouse is the central data model", "Jobs: import, provisioning, analytics, utility", "Rules & workflows drive automation"]),
      L("m2", 3, "Identity Data Model", "Users (identities) own Accounts on Endpoints. Accounts hold Entitlements (entitlement values grouped by entitlement types). Security Systems group endpoints and connections. Understanding these tables is essential for SQL analytics.", ["Security System → Endpoint → Account → Entitlement", "Entitlement types categorize entitlement values", "Users ↔ accounts linked via correlation"]),
      L("m2", 4, "Connections & Import Jobs", "A Connection stores how EIC communicates with a target (type, credentials, JSON configs). Import jobs pull accounts and entitlements on a schedule; full and incremental imports keep EIC synchronized.", ["Connection = technical config", "Schedule full imports less often than incremental", "Review job history for failures"]),
      L("m2", 5, "Correlation & Attribute Mapping", "Correlation rules match imported accounts to identities, usually by employee ID, email or username. Attribute mapping translates target fields into EIC attributes. Poor correlation produces orphan accounts.", ["Prefer immutable unique keys for correlation", "Test correlation on sample data before go-live", "Orphan count is a key health metric"]),
    ],
  },
  {
    id: "m3", num: 3, title: "Saviynt Implementation", level: "Intermediate",
    summary: "End-to-end implementation lifecycle from requirements to hypercare.",
    lessons: [
      L("m3", 1, "Implementation Lifecycle", "Typical phases: discovery & requirements, design, build (connectors, workflows, rules), testing (unit, SIT, UAT), deployment and hypercare. Waves usually onboard the authoritative source first, then high-risk applications.", ["Onboard HR source before targets", "Prioritize SOX/high-risk apps", "Use transport/migration between environments"]),
      L("m3", 2, "Requirement Gathering", "Capture application inventory, owners, account/entitlement formats, provisioning method (direct vs ticket), approval paths, certification needs and SoD rules. Analyze sample data early to find quality issues.", ["Data quality issues surface late if not analyzed early", "Document correlation keys per app", "Agree approval matrices with business"]),
      L("m3", 3, "Application Onboarding", "Create the security system and endpoint, configure the connection, define account and entitlement import mappings, run imports, validate correlation, then enable provisioning and request configuration.", ["Validate imports before enabling provisioning", "Set entitlement owners and descriptions for requestability", "Configure endpoint-level request forms if needed"]),
      L("m3", 4, "Provisioning & Workflow Config", "Provisioning can be direct (connector) or manual (ticket/service desk). Attach approval workflows to endpoints or entitlements, and configure create/update/disable/remove account JSON for direct provisioning.", ["Test create, add access, remove access, disable", "Handle failures with retries & notifications", "Use dynamic attributes for request-time data"]),
      L("m3", 5, "Testing, Deployment & Hypercare", "Test every lifecycle event end-to-end with real-like data. Migrate configuration via transport packages, monitor jobs closely after go-live, and track defects during hypercare until stable.", ["Keep test evidence for auditors", "Monitor job failures daily in hypercare", "Hand over runbooks to support"]),
    ],
  },
  {
    id: "m4", num: 4, title: "Application Connectors", level: "Intermediate",
    summary: "AD, Azure AD/Entra, REST, DB, SAP, Workday, ServiceNow and more.",
    lessons: [
      L("m4", 1, "Active Directory", "The AD connector uses LDAP(S) to import users, groups and memberships and to provision accounts. Key configs include base DNs, search filters, attribute mappings and create-account JSON. Use LDAPS and least-privileged service accounts.", ["Scope imports with search filters and OUs", "Use LDAPS (636) for password operations", "Map sAMAccountName / objectGUID carefully"]),
      L("m4", 2, "Azure AD / Microsoft Entra ID", "Uses Microsoft Graph APIs via an app registration with application permissions. Imports users, groups, roles and licenses; provisions users and group memberships.", ["App registration + client secret/cert", "Grant admin consent for Graph permissions", "Watch Graph throttling on large tenants"]),
      L("m4", 3, "REST Connector", "A generic connector driven by JSON: ConnectionJSON (auth), ImportUserJSON / ImportAccountEntJSON (imports with pagination), and CreateAccountJSON, AddAccessJSON etc. for provisioning. It covers most SaaS apps.", ["Handle pagination and token refresh in JSON", "Use response mappings to pick attributes", "Test calls in Postman before configuring"]),
      L("m4", 4, "Database Connector", "Connects via JDBC to import accounts and entitlements with SQL queries and to provision using stored procedures or SQL statements.", ["Validate SQL directly against the DB", "Use read-only accounts for import", "Parameterize provisioning statements"]),
      L("m4", 5, "SAP, Workday & ServiceNow", "SAP connectors handle roles, profiles and fine-grained SoD. Workday commonly acts as the authoritative HR source driving JML. ServiceNow is used for ticket-based manual provisioning and as a target.", ["Workday → identity import & lifecycle triggers", "SAP → role-level SoD rulesets", "ServiceNow → manual fulfillment tickets"]),
    ],
  },
  {
    id: "m5", num: 5, title: "Access Request Management", level: "Intermediate",
    summary: "Request lifecycle, approvals, birthright and emergency access.",
    lessons: [
      L("m5", 1, "Access Request Lifecycle", "A user (or manager on their behalf) requests access, SoD checks run, approvals are collected, then provisioning tasks are created and completed. Every step is logged for audit.", ["Request → SoD → Approve → Provision → Close", "Requests can be for self or others", "Track request IDs end-to-end"]),
      L("m5", 2, "Approval Workflows", "Workflows define who approves and in what order: manager, entitlement owner, application owner, risk-based. Serial workflows act one after another; parallel workflows notify all at once.", ["Use escalation for idle approvers", "Risk-based branching for privileged access", "Keep workflows reusable"]),
      L("m5", 3, "Birthright & Role-based Access", "Birthright rules automatically grant baseline access based on attributes like department or location when a joiner is created, removing the need for manual requests.", ["Driven by user/technical rules", "Review birthright scope periodically", "Mover events should re-evaluate birthright"]),
      L("m5", 4, "Emergency & Time-bound Access", "Firefighter or emergency access grants elevated rights for a limited window with mandatory review. Time-bound access automatically expires.", ["Always log and review emergency use", "Prefer start/end dates on privileged access", "Integrate with PAM for sessions"]),
    ],
  },
  {
    id: "m6", num: 6, title: "Access Certification", level: "Intermediate",
    summary: "Campaign types, reviewer actions and remediation.",
    lessons: [
      L("m6", 1, "Certification Concepts", "Certifications (access reviews) periodically ask reviewers to attest that access remains appropriate. Results feed remediation and serve as audit evidence.", ["Certify, revoke, or conditionally certify", "Evidence includes reviewer and timestamp", "Quarterly for SOX-critical apps is common"]),
      L("m6", 2, "Campaign Types", "User manager campaigns review direct reports; entitlement owner and application owner campaigns review access by resource; role campaigns review role membership and composition; micro-certifications trigger on events.", ["Choose type by who knows the access best", "Micro-certs on mover events", "Role owner reviews of role content"]),
      L("m6", 3, "Remediation & Reporting", "Revoked items generate deprovisioning tasks. Track closure, follow up on manual tasks, and report completion rates and revocation statistics to compliance.", ["Close the loop: verify removal in target", "Rubber-stamping is a key risk", "Highlight high-risk items to reviewers"]),
    ],
  },
  {
    id: "m7", num: 7, title: "RBAC & Role Management", level: "Intermediate",
    summary: "Role design, mining, lifecycle and governance.",
    lessons: [
      L("m7", 1, "RBAC Fundamentals", "RBAC assigns access through roles that represent job functions rather than individual entitlements. Enterprise roles bundle access across applications; application roles stay within one.", ["Business roles vs technical roles", "Fewer, well-owned roles beat many narrow ones", "Roles simplify requests and certifications"]),
      L("m7", 2, "Role Mining", "Role mining analyzes existing user-entitlement assignments to find common access patterns, suggesting candidate roles that business owners validate.", ["Clean data before mining", "Validate candidates with business owners", "Avoid role explosion"]),
      L("m7", 3, "Role Lifecycle & Governance", "Roles need owners, approval for changes, periodic certification of content and membership, and retirement when obsolete.", ["Version role changes", "Certify role composition yearly", "Detect unused roles via analytics"]),
    ],
  },
  {
    id: "m8", num: 8, title: "Segregation of Duties (SoD)", level: "Advanced",
    summary: "Rulesets, preventive and detective controls, mitigation.",
    lessons: [
      L("m8", 1, "SoD Concepts", "SoD prevents a single person from holding conflicting duties (e.g. create vendor and pay vendor). Rulesets define functions, the entitlements that make them up, and risks formed by conflicting functions.", ["Function = set of entitlements", "Risk = conflicting functions", "Cross-application SoD is critical"]),
      L("m8", 2, "Preventive vs Detective", "Preventive checks evaluate requests before approval; detective controls scan existing access to find violations.", ["Show violations to approvers at request time", "Run detective scans after imports", "Track violation trends"]),
      L("m8", 3, "Mitigating Controls", "When a conflict is business-justified, apply a mitigating control (e.g. monthly review of transactions) with an owner and expiry, and document acceptance.", ["Controls need owners and expiry", "Re-review accepted risks periodically", "Auditors test mitigation evidence"]),
    ],
  },
  {
    id: "m9", num: 9, title: "Saviynt Analytics & SQL", level: "Intermediate",
    summary: "SQL for EIC data, analytics controls and reports.",
    lessons: [
      L("m9", 1, "EIC Tables for SQL", "Common tables include USERS, ACCOUNTS, ENTITLEMENT_VALUES, ENTITLEMENT_TYPES, ENDPOINTS, USER_ACCOUNTS and ACCOUNT_ENTITLEMENTS1. Join keys like USERKEY, ACCOUNTKEY and ENTITLEMENT_VALUEKEY connect them. Verify exact names in your tenant's schema.", ["USER_ACCOUNTS links users to accounts", "ACCOUNT_ENTITLEMENTS1 links accounts to entitlements", "Status columns distinguish active/inactive"]),
      L("m9", 2, "Common Governance Queries", "Typical analytics: orphan accounts (accounts with no user link), terminated users with active accounts, dormant accounts, privileged access holders, and SoD conflict listings.", ["LEFT JOIN … IS NULL for orphans", "Filter terminated users by status", "Use date columns for dormancy"]),
      L("m9", 3, "Analytics Controls", "Analytics (runtime or elastic) wrap SQL into scheduled controls that can alert, create certifications or trigger remediation actions.", ["Parameterize queries", "Schedule and email results", "Attach remediation actions"]),
    ],
  },
  {
    id: "m10", num: 10, title: "Workflows & Automation", level: "Intermediate",
    summary: "Jobs, rules, schedulers and notifications.",
    lessons: [
      L("m10", 1, "Jobs & Schedulers", "EIC jobs include identity/account/entitlement imports, provisioning, analytics, certification and utility jobs. Chain jobs with triggers so imports run before analytics.", ["Order matters: identity → accounts → analytics", "Monitor job history & logs", "Avoid overlapping heavy jobs"]),
      L("m10", 2, "User Update & Technical Rules", "Rules react to identity creation or attribute changes to grant/revoke access, create tasks or launch micro-certifications — the engine for joiner/mover/leaver automation.", ["Test rules on a small population first", "Leaver rules should disable then remove", "Log every automated action"]),
      L("m10", 3, "Email Templates & Notifications", "Templates notify requesters, approvers and reviewers. Use dynamic placeholders and keep messages short and actionable.", ["Include direct action links", "Avoid notification fatigue", "Escalate overdue tasks"]),
    ],
  },
  {
    id: "m11", num: 11, title: "Advanced IGA Topics", level: "Advanced",
    summary: "PAM, Zero Trust, cloud governance and identity analytics.",
    lessons: [
      L("m11", 1, "Privileged Access Management", "PAM secures privileged accounts with vaulting, just-in-time elevation and session monitoring. Converged platforms govern privileged access alongside standard IGA.", ["Remove standing admin rights", "Record privileged sessions", "Certify privileged access more often"]),
      L("m11", 2, "Cloud & Machine Identities", "Cloud platforms (AWS, Azure, GCP) and service accounts multiply non-human identities. Govern them with owners, lifecycle and least privilege.", ["Every machine identity needs an owner", "Rotate secrets automatically", "Detect over-permissioned cloud roles"]),
      L("m11", 3, "Identity Analytics & AI", "Peer-group analysis and risk scoring highlight outlier access, helping reviewers focus on risky items and enabling intelligent recommendations.", ["Outlier access = review priority", "Risk scores guide approvals", "Combine with SoD for full picture"]),
    ],
  },
];

export const ALL_LESSONS = MODULES.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleId: m.id })));
export const moduleById = (id: string) => MODULES.find((m) => m.id === id);

export type Lab = { id: string; title: string; area: string; difficulty: string; symptom: string; steps: string[]; rootCause: string; fix: string };

export const LABS: Lab[] = [
  { id: "orphans", title: "Accounts imported as orphans", area: "Imports", difficulty: "Intermediate", symptom: "After an AD account import, 4,000 of 5,200 accounts show as orphan accounts.", steps: ["Check the correlation rule configured on the endpoint/security system", "Compare the correlation attribute values in accounts vs users (case, prefixes, leading zeros)", "Run SQL to find unmatched accounts and sample them", "Re-run the import after fixing correlation"], rootCause: "Correlation used employeeID, but AD stored it with a leading 'E' prefix while HR did not.", fix: "Adjust the correlation logic/attribute mapping to normalize the value, then re-import and verify orphan count drops." },
  { id: "provision", title: "Approved request not provisioned", area: "Provisioning", difficulty: "Intermediate", symptom: "A user's access request shows Approved, but the group was never added in the target.", steps: ["Open the request and check pending tasks", "Check whether the provisioning job ran and its history", "Review connector logs for the AddAccess call", "Validate the AddAccessJSON / service account permissions"], rootCause: "The provisioning job was disabled after a maintenance window, so tasks stayed pending.", fix: "Re-enable/schedule the provisioning job, process pending tasks, and add monitoring on pending task age." },
  { id: "rest401", title: "REST connector returns 401", area: "Connectors", difficulty: "Advanced", symptom: "Imports from a SaaS app fail with HTTP 401 after working for months.", steps: ["Check ConnectionJSON token configuration", "Test the token call in Postman", "Verify the client secret's expiry in the SaaS admin console", "Check whether token refresh is configured"], rootCause: "The OAuth client secret expired.", fix: "Rotate the secret, update the connection, and set a reminder/monitor for expiry." },
  { id: "cert", title: "Certification revocations not completing", area: "Certification", difficulty: "Intermediate", symptom: "Reviewers revoked 300 items but users still have access weeks later.", steps: ["Check revoke tasks created from the campaign", "Determine if the endpoint uses direct or manual provisioning", "Review ServiceNow ticket status for manual endpoints", "Verify task closure after removal"], rootCause: "Endpoint was manual; tickets were created but nobody was assigned in the service desk queue.", fix: "Route tickets to the correct assignment group, add SLA escalation, and reconcile via import." },
  { id: "leaver", title: "Terminated users still active", area: "Lifecycle", difficulty: "Beginner", symptom: "Audit finds terminated employees with active accounts in finance apps.", steps: ["Run SQL: terminated users joined with active accounts", "Check the leaver user update rule conditions", "Confirm HR import is updating status/end date", "Check rule execution history"], rootCause: "The HR import mapped termination date but not the status field, so the leaver rule condition never triggered.", fix: "Fix the attribute mapping, re-run the HR import, execute the leaver rule, and add a detective analytics control." },
  { id: "sod", title: "SoD violation slipped through", area: "SoD", difficulty: "Advanced", symptom: "A user holds Create Vendor and Approve Payment in SAP without any flagged violation.", steps: ["Check the SoD ruleset includes both functions", "Confirm function definitions map to current SAP roles/tcodes", "Verify preventive SoD evaluation is enabled on the request workflow", "Run a detective SoD scan"], rootCause: "A newly created SAP role containing the payment tcode was not mapped to the function definition.", fix: "Update the function definition, rerun the detective scan, remediate or mitigate, and add a role-change review step." },
];

export const LEVELS = ["Beginner", "IAM Analyst", "Saviynt Developer", "Saviynt Consultant", "Senior IGA Engineer", "IAM Architect", "Interview Candidate"];

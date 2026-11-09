// Diagram definitions for the interactive lesson diagrams.
export type FlowNode = { id: string; label: string; detail: string; lane?: string };
export type FlowDef = { kind: "flow"; title: string; lanes?: { id: string; label: string }[]; nodes: FlowNode[]; legend?: string };
export type ArchDef = { kind: "architecture"; title: string };
export type ConnectorDef = {
  kind: "connector";
  title: string;
  system: string;
  protocol: string;
  direction: "inbound" | "outbound" | "both";
  imports: string[];
  provisions: string[];
  processes: string[];
  prerequisites: string[];
};
export type ModelDef = { kind: "model"; title: string };
export type DiagramDef = FlowDef | ArchDef | ConnectorDef | ModelDef;

const flow = (title: string, steps: [string, string][], legend?: string): FlowDef => ({
  kind: "flow",
  title,
  legend,
  nodes: steps.map(([label, detail], i) => ({ id: `s${i}`, label, detail })),
});

const conn = (c: Omit<ConnectorDef, "kind">): ConnectorDef => ({ kind: "connector", ...c });

export const DIAGRAMS: Record<string, DiagramDef> = {
  "eic-architecture": { kind: "architecture", title: "Saviynt Enterprise Identity Cloud — reference architecture" },
  "data-model": { kind: "model", title: "Saviynt identity data model" },
  jml: {
    kind: "flow",
    title: "Identity lifecycle — Joiner, Mover, Leaver",
    lanes: [
      { id: "j", label: "Joiner" },
      { id: "m", label: "Mover" },
      { id: "l", label: "Leaver" },
    ],
    legend: "Each lane is triggered by an event in the authoritative HR source and executed by EIC rules and connectors.",
    nodes: [
      { id: "j1", lane: "j", label: "HR creates employee", detail: "A new worker record is created in the HR system (e.g. Workday) with a start date, department, manager and job code." },
      { id: "j2", lane: "j", label: "Identity import", detail: "The scheduled HR import job pulls the new record into EIC and creates the user (identity)." },
      { id: "j3", lane: "j", label: "Identity correlation", detail: "Correlation rules link any pre-existing accounts (e.g. a rehire's AD account) to the new identity using a unique key." },
      { id: "j4", lane: "j", label: "Account provisioning", detail: "Birthright rules create accounts in target systems such as AD and email through connectors." },
      { id: "j5", lane: "j", label: "Access assignment", detail: "Role/birthright entitlements are added so the worker is productive on day one." },
      { id: "m1", lane: "m", label: "Department change", detail: "HR records a transfer, promotion or manager change." },
      { id: "m2", lane: "m", label: "Attributes update", detail: "The next HR import updates identity attributes (department, title, manager, location)." },
      { id: "m3", lane: "m", label: "Access evaluation", detail: "User update rules detect the change and evaluate which access no longer fits the new role." },
      { id: "m4", lane: "m", label: "Old access removal", detail: "Access tied to the previous role is revoked, or sent to the new manager for a micro-certification." },
      { id: "m5", lane: "m", label: "New access provisioning", detail: "Birthright/role access for the new position is provisioned." },
      { id: "l1", lane: "l", label: "Employee termination", detail: "HR records the termination with an effective date." },
      { id: "l2", lane: "l", label: "Identity status update", detail: "The import marks the identity inactive (status/enddate)." },
      { id: "l3", lane: "l", label: "Access removal", detail: "Leaver rules create revoke tasks for entitlements, prioritising privileged access." },
      { id: "l4", lane: "l", label: "Account disablement", detail: "Accounts are disabled immediately and deleted after the retention period." },
      { id: "l5", lane: "l", label: "Deprovisioning validation", detail: "A post-import check / analytics control confirms nothing remains active — evidence for auditors." },
    ],
  },
  onboarding: flow("Application onboarding workflow", [
    ["Application discovery", "Inventory the application, its owner, risk rating and user population."],
    ["Requirement gathering", "Capture account/entitlement formats, provisioning method, approvals and certification needs."],
    ["Connector selection", "Choose AD, REST, JDBC, SCIM, SAP, flat file, etc. based on the app's interfaces."],
    ["Connection configuration", "Create the connection with credentials and JSON/SQL configs; test connectivity."],
    ["Attribute mapping", "Map target fields to EIC account and entitlement attributes; define correlation."],
    ["Account import", "Run the account import and review orphan/correlation results."],
    ["Entitlement import", "Import entitlement types/values, owners and descriptions for requestability."],
    ["Provisioning configuration", "Configure create/update/disable/add-access operations or manual tickets."],
    ["Testing", "Unit, SIT and UAT for each lifecycle event with evidence captured."],
    ["Production deployment", "Transport configuration, run initial imports and enter hypercare."],
  ]),
  "access-request": flow("Access request workflow", [
    ["User submits request", "The user (or a manager on their behalf) selects an application, role or entitlement and gives a business justification."],
    ["Manager approval", "The line manager confirms the business need."],
    ["Application owner approval", "The application/entitlement owner confirms the access is appropriate for the system."],
    ["Policy & SoD evaluation", "Preventive SoD and policy checks flag conflicts; risky requests can be routed to extra approvers."],
    ["Provisioning", "EIC creates a task and provisions through the connector, or raises a manual ticket."],
    ["Request completion", "The request closes when provisioning is confirmed and the requester is notified."],
    ["Audit history", "Every decision, approver and timestamp is retained for audit."],
  ]),
  certification: flow("Access certification workflow", [
    ["Campaign creation", "Define campaign type (manager, entitlement owner, application, role), scope and schedule."],
    ["Reviewer assignment", "EIC assigns line items to reviewers; delegation and fallback reviewers are configured."],
    ["Access review", "Reviewers see users, accounts and entitlements with risk insights."],
    ["Approve or revoke", "Each item is certified, revoked or conditionally certified with comments."],
    ["Remediation", "Revocations become deprovisioning tasks (automatic or ticket-based)."],
    ["Campaign closure", "The campaign closes once all items are decided and remediation tracked."],
    ["Audit reporting", "Completion, revocation and evidence reports are produced for auditors."],
  ]),
  rbac: flow("Role-based access control", [
    ["Business requirements", "Understand job functions, departments and access patterns."],
    ["Role engineering", "Combine top-down (business) and bottom-up (role mining) analysis."],
    ["Business roles", "Roles named after job functions, e.g. 'AP Clerk'."],
    ["Technical roles", "Application-level roles that bundle entitlements in one system."],
    ["Entitlements", "The actual groups, profiles and permissions in target systems."],
    ["User assignment", "Users receive roles via birthright rules or requests."],
    ["Access provisioning", "EIC provisions every entitlement contained in the role."],
  ]),
  sod: flow("Segregation of duties evaluation", [
    ["Access request", "A user requests access that may combine sensitive functions."],
    ["Policy evaluation", "The SoD ruleset maps entitlements to functions and functions to risks."],
    ["Conflict detection", "EIC detects that the user would hold two conflicting functions."],
    ["Risk assessment", "Risk level and business impact are shown to approvers."],
    ["Approve or reject", "Approvers reject, or approve with justification."],
    ["Mitigation", "Approved conflicts receive a mitigating control with owner and expiry."],
    ["Audit reporting", "Violations, mitigations and exceptions are reported to compliance."],
  ]),
  provisioning: flow("Provisioning architecture", [
    ["Trigger", "A request approval, rule, role change or certification revoke creates a change."],
    ["Task creation", "EIC creates a pending task (add access, create account, disable, remove)."],
    ["Provisioning job", "The provisioning job picks up pending tasks on schedule."],
    ["Connector call", "The connector executes the operation via LDAP, REST, JDBC, SCIM, etc."],
    ["Response handling", "Success completes the task; failures retry and notify."],
    ["Reconciliation", "The next import confirms the target state matches EIC."],
  ]),
  "import-flow": flow("Data import & synchronisation", [
    ["Schedule", "Import jobs run on a schedule (full or incremental)."],
    ["Extract", "The connector reads accounts, entitlements and memberships from the target."],
    ["Transform", "Attribute mappings convert target fields into EIC attributes."],
    ["Correlate", "Correlation rules link accounts to identities; unmatched become orphans."],
    ["Load", "Accounts, entitlements and relationships are created/updated in the identity warehouse."],
    ["Post-processing", "Rules, analytics and SoD scans run on the fresh data."],
  ]),
  implementation: flow("Saviynt implementation lifecycle", [
    ["Discovery", "Stakeholders, scope, applications and success criteria."],
    ["Design", "Data model, connectors, workflows, roles and certification design."],
    ["Build", "Configure connections, rules, workflows and analytics."],
    ["Test", "Unit, SIT and UAT with business sign-off."],
    ["Deploy", "Transport to production and run initial loads."],
    ["Hypercare", "Heightened monitoring, defect fixes and handover to support."],
  ]),
  "connector:ad": conn({ title: "Active Directory connector", system: "Active Directory", protocol: "LDAP / LDAPS (636)", direction: "both", imports: ["Users / accounts", "Groups", "Group memberships", "OU structure"], provisions: ["Create / disable / move account", "Add / remove group", "Password reset"], processes: ["JML", "Access requests", "Certifications", "Orphan detection"], prerequisites: ["Service account with delegated OU rights", "LDAPS certificate", "Connector gateway for on-prem reach"] }),
  "connector:entra": conn({ title: "Microsoft Entra ID connector", system: "Microsoft Entra ID", protocol: "Microsoft Graph API (OAuth 2.0)", direction: "both", imports: ["Users", "Groups", "Directory roles", "Licenses"], provisions: ["Create / update / disable user", "Group membership", "License assignment"], processes: ["JML", "Access requests", "Certifications", "Privileged role reviews"], prerequisites: ["App registration", "Client secret or certificate", "Admin-consented Graph permissions"] }),
  "connector:workday": conn({ title: "Workday connector", system: "Workday HCM", protocol: "Workday web services / RaaS (HTTPS)", direction: "inbound", imports: ["Workers", "Job & org data", "Managers", "Hire / termination dates"], provisions: ["Optional write-back (e.g. email, username)"], processes: ["Authoritative identity source", "Joiner / mover / leaver triggers"], prerequisites: ["Integration system user", "Report or web-service access", "Field mapping agreed with HR"] }),
  "connector:sap": conn({ title: "SAP ECC / S/4HANA connector", system: "SAP ECC / S/4HANA", protocol: "SAP JCo (RFC/BAPI)", direction: "both", imports: ["Users", "Roles", "Profiles", "T-codes for SoD"], provisions: ["Create / lock user", "Assign / remove roles", "Validity dates"], processes: ["Access requests", "Fine-grained SoD", "Certifications", "Emergency access"], prerequisites: ["RFC user with required authorisations", "SAP JCo libraries", "Connector gateway"] }),
  "connector:hana": conn({ title: "SAP HANA connector", system: "SAP HANA database", protocol: "JDBC", direction: "both", imports: ["DB users", "Roles", "Privileges"], provisions: ["Create / deactivate user", "Grant / revoke roles"], processes: ["Privileged DB access governance", "Certifications"], prerequisites: ["Technical DB user with USER ADMIN / ROLE ADMIN", "HANA JDBC driver"] }),
  "connector:successfactors": conn({ title: "SAP SuccessFactors connector", system: "SAP SuccessFactors", protocol: "OData API (HTTPS)", direction: "inbound", imports: ["Employees", "Employment info", "Org & manager data"], provisions: ["Optional write-back of email/username"], processes: ["Authoritative identity source", "JML triggers"], prerequisites: ["API user / OAuth client", "OData permissions", "Field mapping"] }),
  "connector:oracle": conn({ title: "Oracle connector", system: "Oracle DB / Oracle EBS", protocol: "JDBC / EBS APIs", direction: "both", imports: ["Users", "Responsibilities / roles", "Grants"], provisions: ["Create / end-date user", "Assign responsibilities"], processes: ["Access requests", "SoD", "Certifications"], prerequisites: ["Service user with required grants", "Oracle JDBC driver", "Network reach via gateway"] }),
  "connector:jdbc": conn({ title: "JDBC / database connector", system: "Any relational database", protocol: "JDBC (SQL)", direction: "both", imports: ["Accounts via SQL query", "Entitlements via SQL query"], provisions: ["Stored procedures or SQL statements"], processes: ["Custom app onboarding", "Certifications"], prerequisites: ["Read-only import user", "Provisioning user / procedures", "JDBC driver & URL"] }),
  "connector:rest": conn({ title: "REST API connector", system: "SaaS / custom REST APIs", protocol: "HTTPS + JSON (OAuth, basic, API key)", direction: "both", imports: ["Users / accounts (paged)", "Groups / roles"], provisions: ["CreateAccountJSON", "AddAccessJSON / RemoveAccessJSON", "Disable / delete"], processes: ["SaaS onboarding", "Access requests", "Certifications"], prerequisites: ["API credentials", "API documentation & rate limits", "Tested calls (e.g. Postman)"] }),
  "connector:scim": conn({ title: "SCIM 2.0 connector", system: "SCIM-compliant applications", protocol: "SCIM 2.0 over HTTPS", direction: "both", imports: ["/Users", "/Groups"], provisions: ["POST/PATCH /Users", "Group membership PATCH", "active=false to disable"], processes: ["Standards-based SaaS provisioning", "Certifications"], prerequisites: ["SCIM base URL", "Bearer token / OAuth", "Supported attribute schema"] }),
  "connector:sftp": conn({ title: "SFTP / flat-file connector", system: "Disconnected applications", protocol: "SFTP file exchange (CSV)", direction: "inbound", imports: ["Accounts file", "Entitlements file"], provisions: ["Manual tickets (no direct write)"], processes: ["Disconnected app governance", "Certifications"], prerequisites: ["SFTP host & key", "Agreed file layout & schedule"] }),
  "connector:servicenow": conn({ title: "ServiceNow connector", system: "ServiceNow", protocol: "REST API (HTTPS)", direction: "both", imports: ["Users", "Groups / roles", "Ticket status"], provisions: ["Create fulfilment tickets", "Group / role membership"], processes: ["Manual provisioning", "Request fulfilment tracking", "Certifications"], prerequisites: ["Integration user", "Catalog item / table design", "Status mapping"] }),
};

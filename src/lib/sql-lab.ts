// Sample Saviynt-style schema (simplified) for the in-browser SQL practice area.
export const SCHEMA_SQL = `
CREATE TABLE users (userkey INTEGER PRIMARY KEY, username TEXT, firstname TEXT, lastname TEXT, email TEXT, department TEXT, manager INTEGER, statuskey INTEGER, enddate TEXT);
CREATE TABLE endpoints (endpointkey INTEGER PRIMARY KEY, endpointname TEXT, securitysystem TEXT);
CREATE TABLE accounts (accountkey INTEGER PRIMARY KEY, name TEXT, endpointkey INTEGER, status TEXT, lastlogondate TEXT, accounttype TEXT);
CREATE TABLE user_accounts (userkey INTEGER, accountkey INTEGER);
CREATE TABLE entitlement_types (entitlementtypekey INTEGER PRIMARY KEY, entitlementname TEXT, endpointkey INTEGER);
CREATE TABLE entitlement_values (entitlement_valuekey INTEGER PRIMARY KEY, entitlement_value TEXT, entitlementtypekey INTEGER, risk TEXT, privileged INTEGER);
CREATE TABLE account_entitlements1 (accountkey INTEGER, entitlement_valuekey INTEGER);

INSERT INTO users VALUES
(1,'jdoe','John','Doe','jdoe@corp.com','Finance',5,1,NULL),
(2,'asmith','Alice','Smith','asmith@corp.com','IT',6,1,NULL),
(3,'bwong','Ben','Wong','bwong@corp.com','Finance',5,0,'2026-08-31'),
(4,'cpatel','Chitra','Patel','cpatel@corp.com','HR',7,1,NULL),
(5,'mgarcia','Maria','Garcia','mgarcia@corp.com','Finance',NULL,1,NULL),
(6,'tlee','Tom','Lee','tlee@corp.com','IT',NULL,1,NULL),
(7,'rkhan','Rina','Khan','rkhan@corp.com','HR',NULL,1,NULL),
(8,'dmiller','Dan','Miller','dmiller@corp.com','Sales',6,0,'2026-09-15'),
(9,'snair','Sara','Nair','snair@corp.com','Sales',6,1,NULL);

INSERT INTO endpoints VALUES (1,'Active Directory','AD'),(2,'SAP ECC','SAP'),(3,'Salesforce','SFDC');

INSERT INTO accounts VALUES
(101,'jdoe',1,'Active','2026-11-01','User'),
(102,'asmith',1,'Active','2026-11-05','User'),
(103,'bwong',1,'Active','2026-07-20','User'),
(104,'cpatel',1,'Active','2026-10-30','User'),
(105,'svc_backup',1,'Active','2026-11-08','Service'),
(106,'JDOE',2,'Active','2026-11-02','User'),
(107,'BWONG',2,'Active','2026-08-01','User'),
(108,'MGARCIA',2,'Active','2026-11-03','User'),
(109,'old_admin',2,'Active','2025-12-01','User'),
(110,'dmiller',3,'Active','2026-09-10','User'),
(111,'snair',3,'Active','2026-11-07','User'),
(112,'adm_asmith',1,'Active','2026-11-06','Admin'),
(113,'tlee',1,'Inactive','2026-03-01','User');

INSERT INTO user_accounts VALUES (1,101),(2,102),(3,103),(4,104),(1,106),(3,107),(5,108),(8,110),(9,111),(2,112),(6,113);

INSERT INTO entitlement_types VALUES (1,'Group',1),(2,'Role',2),(3,'Profile',3);

INSERT INTO entitlement_values VALUES
(1,'Domain Users',1,'Low',0),
(2,'Domain Admins',1,'High',1),
(3,'Finance-Share-RW',1,'Medium',0),
(4,'Z_AP_CREATE_VENDOR',2,'High',0),
(5,'Z_AP_APPROVE_PAYMENT',2,'High',0),
(6,'Z_GL_DISPLAY',2,'Low',0),
(7,'System Administrator',3,'High',1),
(8,'Sales User',3,'Low',0);

INSERT INTO account_entitlements1 VALUES
(101,1),(101,3),(102,1),(103,1),(103,3),(104,1),(105,2),(112,2),(112,1),
(106,4),(106,5),(106,6),(107,6),(108,5),(108,6),(109,4),(109,5),
(110,8),(110,7),(111,8);
`;

export const SCHEMA_DOC = [
  { table: "users", cols: "userkey, username, firstname, lastname, email, department, manager (userkey), statuskey (1 active / 0 inactive), enddate" },
  { table: "endpoints", cols: "endpointkey, endpointname, securitysystem" },
  { table: "accounts", cols: "accountkey, name, endpointkey, status, lastlogondate, accounttype" },
  { table: "user_accounts", cols: "userkey, accountkey — links identities to accounts" },
  { table: "entitlement_types", cols: "entitlementtypekey, entitlementname, endpointkey" },
  { table: "entitlement_values", cols: "entitlement_valuekey, entitlement_value, entitlementtypekey, risk, privileged (1/0)" },
  { table: "account_entitlements1", cols: "accountkey, entitlement_valuekey — links accounts to entitlements" },
];

export type Exercise = { id: string; title: string; level: string; task: string; hint: string; solution: string };

export const EXERCISES: Exercise[] = [
  { id: "e1", title: "Active Finance users", level: "Beginner", task: "List the username and email of all active users (statuskey = 1) in the Finance department.", hint: "Filter users on two columns with AND.", solution: "SELECT username, email FROM users WHERE department = 'Finance' AND statuskey = 1;" },
  { id: "e2", title: "Accounts per endpoint", level: "Beginner", task: "Show each endpoint name and how many accounts it has, highest first.", hint: "JOIN accounts to endpoints, GROUP BY the endpoint name.", solution: "SELECT e.endpointname, COUNT(a.accountkey) AS total FROM endpoints e JOIN accounts a ON a.endpointkey = e.endpointkey GROUP BY e.endpointname ORDER BY total DESC;" },
  { id: "e3", title: "Orphan accounts", level: "Intermediate", task: "Find all accounts (account name and endpoint name) that are not linked to any user.", hint: "LEFT JOIN user_accounts and keep rows where the link is NULL.", solution: "SELECT a.name, e.endpointname FROM accounts a JOIN endpoints e ON e.endpointkey = a.endpointkey LEFT JOIN user_accounts ua ON ua.accountkey = a.accountkey WHERE ua.userkey IS NULL;" },
  { id: "e4", title: "Terminated users with active access", level: "Intermediate", task: "List usernames of inactive users (statuskey = 0) together with the names of their accounts that are still Active.", hint: "users → user_accounts → accounts, filter both statuses.", solution: "SELECT u.username, a.name FROM users u JOIN user_accounts ua ON ua.userkey = u.userkey JOIN accounts a ON a.accountkey = ua.accountkey WHERE u.statuskey = 0 AND a.status = 'Active';" },
  { id: "e5", title: "Privileged access holders", level: "Intermediate", task: "Show the username, account name and entitlement value for every privileged entitlement (privileged = 1) held by a linked user.", hint: "Chain five tables: users, user_accounts, accounts, account_entitlements1, entitlement_values.", solution: "SELECT u.username, a.name, ev.entitlement_value FROM users u JOIN user_accounts ua ON ua.userkey = u.userkey JOIN accounts a ON a.accountkey = ua.accountkey JOIN account_entitlements1 ae ON ae.accountkey = a.accountkey JOIN entitlement_values ev ON ev.entitlement_valuekey = ae.entitlement_valuekey WHERE ev.privileged = 1;" },
  { id: "e6", title: "SoD conflict: create & approve", level: "Advanced", task: "Find accounts that hold BOTH Z_AP_CREATE_VENDOR and Z_AP_APPROVE_PAYMENT. Return the account name.", hint: "Join account_entitlements1 to itself (or use GROUP BY … HAVING COUNT(DISTINCT …) = 2).", solution: "SELECT a.name FROM accounts a JOIN account_entitlements1 ae ON ae.accountkey = a.accountkey JOIN entitlement_values ev ON ev.entitlement_valuekey = ae.entitlement_valuekey WHERE ev.entitlement_value IN ('Z_AP_CREATE_VENDOR','Z_AP_APPROVE_PAYMENT') GROUP BY a.name HAVING COUNT(DISTINCT ev.entitlement_value) = 2;" },
  { id: "e7", title: "Dormant accounts", level: "Advanced", task: "List active accounts whose lastlogondate is before 2026-09-01, with the owner's username if any (show NULL for orphans).", hint: "LEFT JOIN through user_accounts to users; compare dates as text (YYYY-MM-DD).", solution: "SELECT a.name, a.lastlogondate, u.username FROM accounts a LEFT JOIN user_accounts ua ON ua.accountkey = a.accountkey LEFT JOIN users u ON u.userkey = ua.userkey WHERE a.status = 'Active' AND a.lastlogondate < '2026-09-01';" },
];

/** Compare two result sets ignoring row order and column names. */
export function sameResult(a: unknown[][], b: unknown[][]): boolean {
  if (a.length !== b.length) return false;
  if (a.length && a[0]!.length !== b[0]!.length) return false;
  const norm = (rows: unknown[][]) => rows.map((r) => JSON.stringify(r.map((v) => (typeof v === "string" ? v.toLowerCase() : v)))).sort();
  const x = norm(a), y = norm(b);
  return x.every((v, i) => v === y[i]);
}

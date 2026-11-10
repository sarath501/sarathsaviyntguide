import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clipboard, Code2, Database, Plug, Search, ShieldCheck, Workflow, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/connector-studio")({ component: ConnectorStudio });

type Connector = {
  id: string; name: string; category: string; purpose: string; protocol: string;
  auth: string[]; fields: { label: string; value: string; note: string }[];
  source: string[]; target: string[]; checks: string[];
};
const CONNECTORS: Connector[] = [
  { id: "ad", name: "Active Directory", category: "Directory", purpose: "Aggregate directory accounts and manage access to AD groups.", protocol: "LDAP / LDAPS", auth: ["Bind account + password", "LDAPS certificate validation"], fields: [{label:"Host",value:"ldaps://ad.example.test:636",note:"Use the directory FQDN and confirm DNS resolution."},{label:"Base DN",value:"OU=Users,DC=example,DC=test",note:"Scope the search to the approved directory subtree."},{label:"Bind DN",value:"CN=svc_iga,OU=ServiceAccounts,DC=example,DC=test",note:"Use a least-privilege service account."},{label:"Account identifier",value:"sAMAccountName",note:"Must be stable and unique in the aggregation scope."}], source:["sAMAccountName","userPrincipalName","mail","givenName","sn","manager","userAccountControl"], target:["username","email","firstname","lastname","manager","status"], checks:["Resolve the AD hostname from the connector runtime.","Validate LDAPS certificate chain and port 636 reachability.","Test bind credentials and search-base permissions.","Confirm account identifier uniqueness and manager lookup format."] },
  { id: "jdbc", name: "JDBC", category: "Database", purpose: "Read identity or account data from a relational database using SQL.", protocol: "JDBC / SQL", auth: ["Database service account", "TLS where supported"], fields: [{label:"JDBC URL",value:"jdbc:postgresql://db.example.test:5432/identity",note:"Driver and URL syntax depend on the database vendor."},{label:"Driver",value:"org.postgresql.Driver",note:"Confirm driver availability in the connector runtime."},{label:"Username",value:"svc_iga_readonly",note:"Grant only required SELECT access."},{label:"Import query",value:"SELECT account_id, login, email, status FROM app_accounts",note:"Use an explicit column list and stable key."}], source:["account_id","login","email","status"], target:["accountID","username","email","status"], checks:["Confirm DNS, routing, firewall and database listener.","Validate driver class and JDBC URL for the database version.","Test the service account with a read-only query.","Check query aliases, null values, duplicate keys and paging."] },
  { id: "rest", name: "REST API", category: "API", purpose: "Integrate SaaS or custom applications through HTTP APIs.", protocol: "HTTPS / JSON", auth: ["OAuth 2.0 client credentials", "API key", "Basic authentication only when approved"], fields: [{label:"Base URL",value:"https://api.example.test/v1",note:"Use HTTPS and the tenant-specific API base URL."},{label:"Authentication",value:"OAuth 2.0 client credentials",note:"Store secrets in an approved secret store, never in lesson notes."},{label:"Accounts endpoint",value:"/accounts",note:"Verify the endpoint and version in the vendor API contract."},{label:"Response collection",value:"items",note:"Match the actual JSON response structure."}], source:["id","userName","email","active","department"], target:["accountID","username","email","status","department"], checks:["Verify API base URL, DNS, TLS and outbound allowlisting.","Confirm token endpoint, scopes, audience and expiry handling.","Inspect pagination, rate limits and response collection path.","Test 401, 403, 404, 429 and server-error handling."] },
  { id: "scim", name: "SCIM", category: "API", purpose: "Exchange standardized identity resources with SCIM-enabled services.", protocol: "SCIM 2.0 / HTTPS", auth: ["Bearer token", "OAuth 2.0"], fields: [{label:"Service URL",value:"https://scim.example.test/v2",note:"Confirm the provider supports SCIM 2.0."},{label:"Users resource",value:"/Users",note:"Check case sensitivity and supported operations."},{label:"Groups resource",value:"/Groups",note:"Group support and membership behavior vary by provider."},{label:"External ID",value:"externalId",note:"Prefer a stable correlation attribute."}], source:["id","externalId","userName","name.givenName","name.familyName","active"], target:["accountID","customproperty1","username","firstname","lastname","status"], checks:["Validate SCIM version and supported resource schemas.","Check PATCH versus PUT semantics and supported operations.","Confirm externalId correlation and immutable ID handling.","Test pagination, filtering and group membership behavior."] },
  { id: "sap", name: "SAP", category: "ERP", purpose: "Govern SAP user accounts and role/profile assignments.", protocol: "Connector-specific / RFC or API", auth: ["Dedicated technical user", "Approved certificate or secure channel"], fields: [{label:"System",value:"S4D (fictional)",note:"Use the correct system ID, client and environment."},{label:"Client",value:"100",note:"Confirm the client number with the SAP owner."},{label:"Account key",value:"BNAME",note:"Validate the account key and uniqueness."},{label:"Role object",value:"AGR_NAME",note:"Role and profile handling depends on connector capability."}], source:["BNAME","USTYP","GLTGV","GLTGB","AGR_NAME"], target:["username","accountType","validFrom","validTo","entitlement"], checks:["Confirm connector prerequisites and network path to SAP.","Validate technical user authorizations with the SAP team.","Check user and role extraction scope and data volumes.","Test role add/remove behavior in a non-production client."] },
  { id: "workday", name: "Workday", category: "HR source", purpose: "Import authoritative worker identity and employment attributes.", protocol: "Workday API / Web Services", auth: ["Integration System User", "OAuth or tenant-supported authentication"], fields: [{label:"Tenant",value:"example_tenant",note:"Tenant names and endpoints are environment-specific."},{label:"Worker data source",value:"Worker",note:"Select the approved worker population and effective-date logic."},{label:"Worker identifier",value:"Worker_ID",note:"Use a stable HR identifier for identity correlation."},{label:"Status mapping",value:"Active / Terminated",note:"Map lifecycle states with HR process owners."}], source:["Worker_ID","User_Name","Email","Manager_ID","Worker_Status","Location"], target:["username","email","manager","status","city"], checks:["Confirm ISU permissions and report/API access.","Validate effective-dated worker and manager records.","Define contingent-worker and rehire handling.","Test null, future-dated and terminated worker scenarios."] },
  { id: "sftp", name: "SFTP", category: "File integration", purpose: "Exchange scheduled identity or account files with an application owner.", protocol: "SFTP / SSH", auth: ["SSH private key", "Password only where policy permits"], fields: [{label:"Host",value:"sftp.example.test",note:"Use the approved hostname and port."},{label:"Port",value:"22",note:"Confirm firewall and routing from the runtime."},{label:"Remote path",value:"/outbound/iga/accounts.csv",note:"Check folder permissions and file naming convention."},{label:"Format",value:"CSV with header row",note:"Agree delimiter, encoding, quoting and date format."}], source:["employee_id","account_name","email","account_status"], target:["username","accountID","email","status"], checks:["Resolve hostname and confirm TCP port 22 reachability.","Validate host key fingerprint and SSH key permissions.","Check remote directory read/write permissions.","Validate file encoding, headers, delimiter, duplicates and schedule."] },
];

const SAMPLE_MAPS: Record<string, { source: string; target: string; transform: string }[]> = {
  ad: [{source:"sAMAccountName",target:"username",transform:"TRIM + lowercase (if policy requires)"},{source:"mail",target:"email",transform:"Direct mapping"},{source:"givenName",target:"firstname",transform:"Direct mapping"},{source:"sn",target:"lastname",transform:"Direct mapping"},{source:"userAccountControl",target:"status",transform:"Convert disabled bit to lifecycle status"},{source:"manager",target:"manager",transform:"Resolve manager using configured correlation key"}],
  jdbc: [{source:"account_id",target:"accountID",transform:"Direct mapping"},{source:"login",target:"username",transform:"TRIM"},{source:"email",target:"email",transform:"LOWERCASE"},{source:"status",target:"status",transform:"Normalize ACTIVE / DISABLED"}],
  rest: [{source:"id",target:"accountID",transform:"Direct mapping"},{source:"userName",target:"username",transform:"Direct mapping"},{source:"email",target:"email",transform:"LOWERCASE"},{source:"active",target:"status",transform:"Boolean to Active / Inactive"}],
  scim: [{source:"id",target:"accountID",transform:"Direct mapping"},{source:"externalId",target:"customproperty1",transform:"Use as correlation reference"},{source:"userName",target:"username",transform:"Direct mapping"},{source:"active",target:"status",transform:"Boolean to Active / Inactive"}],
  sap: [{source:"BNAME",target:"username",transform:"Direct mapping"},{source:"USTYP",target:"accountType",transform:"Map SAP user type codes"},{source:"GLTGV",target:"validFrom",transform:"Normalize date format"},{source:"GLTGB",target:"validTo",transform:"Normalize date format"},{source:"AGR_NAME",target:"entitlement",transform:"Aggregate role assignment"}],
  workday: [{source:"Worker_ID",target:"username",transform:"Use stable HR identifier / agreed username strategy"},{source:"Email",target:"email",transform:"LOWERCASE"},{source:"Manager_ID",target:"manager",transform:"Resolve manager using worker ID"},{source:"Worker_Status",target:"status",transform:"Map HR lifecycle values"},{source:"Location",target:"city",transform:"Normalize location values"}],
  sftp: [{source:"employee_id",target:"username",transform:"TRIM"},{source:"account_name",target:"accountID",transform:"Direct mapping"},{source:"email",target:"email",transform:"LOWERCASE"},{source:"account_status",target:"status",transform:"Normalize source status values"}],
};

function ConnectorStudio() {
  const [selectedId, setSelectedId] = useState("ad");
  const [search, setSearch] = useState("");
  const [completed, setCompleted] = useState<string[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [sourceFields, setSourceFields] = useState("employeeId, username, email, department, managerId, status");
  const [targetFields, setTargetFields] = useState("username, email, department, manager, status");
  const [sampleJson, setSampleJson] = useState('{"employeeId":"E-1042","username":"arjun.k","email":"ARJUN.K@EXAMPLE.TEST","department":"Finance","status":"ACTIVE"}');
  const [testResult, setTestResult] = useState<"pass" | "fail" | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const connector = CONNECTORS.find((item) => item.id === selectedId) ?? CONNECTORS[0]!;
  const filtered = useMemo(() => CONNECTORS.filter((item) => `${item.name} ${item.category} ${item.purpose}`.toLowerCase().includes(search.toLowerCase())), [search]);
  const mapRows = SAMPLE_MAPS[selectedId] ?? [];
  const totalChecks = CONNECTORS.reduce((sum, item) => sum + item.checks.length, 0);
  const doneChecks = Object.values(checks).filter(Boolean).length;

  function selectConnector(id: string) {
    const next = CONNECTORS.find((item) => item.id === id);
    if (!next) return;
    setSelectedId(id);
    setTestResult(null);
    setActiveTab("overview");
    setSourceFields(next.source.join(", "));
    setTargetFields(next.target.join(", "));
  }
  function toggleCheck(index: number) {
    const key = `${selectedId}-${index}`;
    setChecks((previous) => ({...previous, [key]: !previous[key]}));
  }
  function runMappingTest() {
    try {
      const record = JSON.parse(sampleJson) as Record<string, unknown>;
      const sources = sourceFields.split(",").map((item) => item.trim()).filter(Boolean);
      const targets = targetFields.split(",").map((item) => item.trim()).filter(Boolean);
      const valid = sources.length > 0 && targets.length > 0 && sources.every((field) => Object.prototype.hasOwnProperty.call(record, field));
      setTestResult(valid ? "pass" : "fail");
    } catch {
      setTestResult("fail");
    }
  }
  const blueprint = [
    `Connector: ${connector.name}`,
    `Purpose: ${connector.purpose}`,
    `Protocol: ${connector.protocol}`,
    "Connection settings:",
    ...connector.fields.map((field) => `- ${field.label}: ${field.value}`),
    "Attribute mapping examples:",
    ...mapRows.map((row) => `- ${row.source} -> ${row.target} (${row.transform})`),
    "Implementation validation:",
    ...connector.checks.map((item) => `- [ ] ${item}`),
  ].join("\n");

  return (
    <div className="space-y-6">
      <PageHeader title="Saviynt Connector Configuration Studio" subtitle="Learn connector selection, connection setup, attribute mapping and aggregation validation through fictional implementation scenarios." action={<Badge variant="secondary">Interactive practice</Badge>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Connector patterns</p><p className="mt-1 text-2xl font-semibold">{CONNECTORS.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Validation checks completed</p><p className="mt-1 text-2xl font-semibold">{doneChecks}<span className="text-sm text-muted-foreground"> / {totalChecks}</span></p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Mapping examples</p><p className="mt-1 text-2xl font-semibold">{Object.values(SAMPLE_MAPS).reduce((sum, rows) => sum + rows.length, 0)}</p></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input aria-label="Search connectors" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a connector…"/></div>
          <div className="space-y-2">
            {filtered.map((item) => <button key={item.id} type="button" onClick={() => selectConnector(item.id)} className={`w-full rounded-xl border p-3 text-left transition-colors ${selectedId === item.id ? "border-primary bg-primary/5" : "bg-card hover:bg-muted/50"}`}><div className="flex items-center justify-between gap-2"><span className="font-medium">{item.name}</span>{selectedId === item.id && <CheckCircle2 className="h-4 w-4 text-primary"/>}</div><span className="mt-1 block text-xs text-muted-foreground">{item.category} · {item.protocol}</span></button>)}
            {filtered.length === 0 && <p className="rounded-lg border p-4 text-sm text-muted-foreground">No connector matches that search.</p>}
          </div>
        </aside>
        <section className="min-w-0 space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Plug className="h-5 w-5 text-primary"/><h2 className="text-xl font-semibold">{connector.name}</h2></div><p className="mt-2 max-w-3xl text-sm text-muted-foreground">{connector.purpose}</p></div><Badge>{connector.category}</Badge></div>
            <div className="mt-4 flex flex-wrap gap-2 border-b pb-3">
              {["overview","connection","mapping","validation","blueprint"].map((tab) => <Button key={tab} size="sm" variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab)}>{tab[0]!.toUpperCase() + tab.slice(1)}</Button>)}
            </div>
            {activeTab === "overview" && <div className="grid gap-4 pt-4 md:grid-cols-2"><div className="rounded-xl bg-muted/40 p-4"><h3 className="font-semibold">Integration pattern</h3><div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center text-xs"><span className="rounded-lg border bg-background px-3 py-2">Source application</span><span className="text-muted-foreground">→</span><span className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 font-medium">Saviynt EIC</span><span className="text-muted-foreground">→</span><span className="rounded-lg border bg-background px-3 py-2">IGA account / access data</span></div><p className="mt-4 text-xs text-muted-foreground">Conceptual flow only. Actual connector direction, supported operations and architecture depend on the application and tenant.</p></div><div className="rounded-xl bg-muted/40 p-4"><h3 className="font-semibold">Authentication patterns</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{connector.auth.map((item) => <li key={item}>{item}</li>)}</ul><p className="mt-3 text-xs text-muted-foreground">Use least privilege and approved secret management. Never paste real credentials into this practice page.</p></div></div>}
            {activeTab === "connection" && <div className="space-y-3 pt-4"><div><h3 className="font-semibold">Connection configuration examples</h3><p className="text-xs text-muted-foreground">Illustrative values only. Confirm exact parameter names and supported options in your Saviynt release and connector documentation.</p></div>{connector.fields.map((field) => <div key={field.label} className="grid gap-1 rounded-lg border p-3 sm:grid-cols-[150px_1fr]"><span className="text-sm font-medium">{field.label}</span><div><code className="break-all text-xs">{field.value}</code><p className="mt-1 text-xs text-muted-foreground">{field.note}</p></div></div>)}</div>}
            {activeTab === "mapping" && <div className="space-y-3 pt-4"><div><h3 className="font-semibold">Source-to-Saviynt attribute mapping</h3><p className="text-xs text-muted-foreground">Examples show mapping intent. Confirm actual Saviynt user/account schema fields, transformations and connector mapping screens for your tenant.</p></div><div className="overflow-x-auto rounded-lg border"><table className="w-full text-left text-sm"><thead className="bg-muted/60"><tr><th className="p-3">Source attribute</th><th className="p-3">Saviynt target</th><th className="p-3">Mapping / transformation</th></tr></thead><tbody>{mapRows.map((row) => <tr key={row.source} className="border-t"><td className="p-3 font-mono text-xs">{row.source}</td><td className="p-3 font-mono text-xs">{row.target}</td><td className="p-3 text-xs text-muted-foreground">{row.transform}</td></tr>)}</tbody></table></div><div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">Mapping design questions: Is the source attribute authoritative? Can it be null? Is it unique? Does it need normalization? What is the fallback when correlation fails?</div></div>}
            {activeTab === "validation" && <div className="space-y-4 pt-4"><div><h3 className="font-semibold">Connection and aggregation checklist</h3><p className="text-xs text-muted-foreground">Mark each item after you can explain how it is validated in a non-production environment.</p></div>{connector.checks.map((item,index) => <label key={item} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm"><input type="checkbox" checked={!!checks[`${selectedId}-${index}`]} onChange={() => toggleCheck(index)} className="mt-1 h-4 w-4"/><span className={checks[`${selectedId}-${index}`] ? "text-muted-foreground line-through" : ""}>{item}</span></label>)}<div className="flex items-center justify-between rounded-lg bg-muted/50 p-3 text-sm"><span>Connector readiness checklist</span><strong>{connector.checks.filter((_,index) => checks[`${selectedId}-${index}`]).length}/{connector.checks.length}</strong></div></div>}
            {activeTab === "blueprint" && <div className="space-y-3 pt-4"><div><h3 className="font-semibold">Implementation blueprint</h3><p className="text-xs text-muted-foreground">Copy this learning summary into your own implementation notes. It contains no live tenant secrets.</p></div><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-xs">{blueprint}</pre><Button variant="outline" onClick={() => navigator.clipboard?.writeText(blueprint)?.catch(() => undefined)}><Clipboard className="mr-2 h-4 w-4"/>Copy blueprint</Button></div>}
          </div>
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2"><Code2 className="h-5 w-5 text-primary"/><h3 className="font-semibold">Attribute mapping practice tester</h3></div>
            <p className="mt-1 text-xs text-muted-foreground">Provide a fictional JSON source record and list the source/target attributes. This local checker validates JSON and source-field presence; it does not execute Saviynt mappings.</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2"><div><label className="mb-1 block text-xs font-medium">Source attributes (comma-separated)</label><Input value={sourceFields} onChange={(event) => {setSourceFields(event.target.value);setTestResult(null);}}/><label className="mb-1 mt-3 block text-xs font-medium">Target attributes (comma-separated)</label><Input value={targetFields} onChange={(event) => {setTargetFields(event.target.value);setTestResult(null);}}/></div><div><label className="mb-1 block text-xs font-medium">Sample source JSON</label><Textarea value={sampleJson} onChange={(event) => {setSampleJson(event.target.value);setTestResult(null);}} rows={6} className="font-mono text-xs"/></div></div>
            <div className="mt-3 flex flex-wrap items-center gap-3"><Button onClick={runMappingTest}><ShieldCheck className="mr-2 h-4 w-4"/>Validate sample</Button>{testResult === "pass" && <span className="inline-flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4"/>Valid JSON and all listed source attributes are present.</span>}{testResult === "fail" && <span className="inline-flex items-center gap-1 text-sm text-destructive"><XCircle className="h-4 w-4"/>Invalid JSON, or one or more listed source attributes are missing.</span>}</div>
          </div>
          <div className="rounded-xl border border-dashed p-4"><div className="flex items-center gap-2 font-semibold"><Database className="h-4 w-4"/>Implementation reminders</div><ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground"><li>Separate connection testing, account aggregation, identity correlation and provisioning validation.</li><li>Check incremental versus full aggregation behavior, paging, delta tokens and reconciliation where supported.</li><li>Review duplicate account keys, orphan accounts, manager references, null values and status normalization.</li><li>Use non-production endpoints and least-privilege service identities. Do not store passwords, tokens or private keys in this portal.</li><li>Connector capabilities and UI labels vary by Saviynt EIC release, connector type and tenant configuration.</li></ul></div>
        </section>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, ChevronUp, Lightbulb, RotateCcw, Trophy, Search, Filter, Server, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/labs")({
  head: () => ({ meta: [{ title: "Interactive Saviynt Labs — Sarath IGA Learning Portal" }] }),
  component: Labs,
});

type Lab = {
  id: string; title: string; area: string; difficulty: string; symptom: string;
  root_cause: string; fix: string; steps: string[];
};
type Progress = {
  lab_id: string; completed_steps: string[]; diagnosis: string; score: number; completed: boolean;
};

const HINTS: Record<string, string> = {
  "Active Directory": "Trace the request from workflow to provisioning task, then inspect connector reachability, bind account permissions, distinguished names and target response.",
  "SAP": "Separate connectivity, authentication, authorization and target-side validation. Capture the exact SAP return message before changing configuration.",
  "REST": "Check HTTP method and URL, token acquisition, scopes, headers, pagination, response mapping and rate limits in that order.",
  "JDBC": "Validate network path, listener/port, driver, JDBC URL, service account privileges, SQL syntax and returned result-set columns.",
  "SFTP": "Validate DNS, host/port reachability, key or password authentication, remote directory permissions, filename pattern and file encoding.",
};
const PRACTICE = [
  { title: "SQL: find accounts without a linked identity", area: "SQL Practice", prompt: "Write a query approach to identify imported accounts that do not map to a user. State the join key and how you would avoid duplicate rows.", hint: "Start from accounts and use a LEFT JOIN to the identity/account mapping table; filter rows where the identity-side key is NULL. Confirm actual table names in your tenant schema." },
  { title: "JSON: review a REST connector response mapping", area: "JSON Practice", prompt: "A REST response contains a nested array of users with employeeId, email and status. Describe the JSON path and attribute mapping checks you would perform before aggregation.", hint: "Inspect the response root, array path, pagination envelope, null handling, unique correlation key and status normalization. Do not assume a JSON path without seeing the actual payload." },
  { title: "Troubleshooting: account aggregation is incomplete", area: "Incident Triage", prompt: "An aggregation job completes successfully but only a fraction of expected accounts appear. List the first five checks and the evidence you would collect.", hint: "Compare source-side count with fetched, processed, rejected and correlated counts; inspect filters, pagination, permissions, delta watermark and connector logs." },
];


type KnowledgeEntry = {
  id: string; connector: string; category: string; title: string; symptom: string;
  causes: string[]; checks: string[]; resolution: string[]; validation: string[];
};

const TROUBLESHOOTING_GUIDE: KnowledgeEntry[] = [
  {
    id: "ad-connection-timeout", connector: "Active Directory", category: "Connectivity",
    title: "AD connector connection timeout",
    symptom: "Aggregation or provisioning fails with a socket timeout, connection timeout or unreachable LDAP/LDAPS host.",
    causes: ["DNS resolves to an unreachable address or the configured host is incorrect", "Firewall, routing or security-group rules block the LDAP/LDAPS port", "The domain controller or network path is unavailable"],
    checks: ["Resolve the configured hostname from the connector runtime network", "Test TCP reachability to the configured LDAP/LDAPS port (commonly 389/636; confirm tenant configuration)", "Check firewall flow logs, routing and domain-controller availability", "Confirm the configured host, port and TLS mode match the directory design"],
    resolution: ["Restore the network path and allow only the required source-to-destination ports", "Correct the hostname or port if the endpoint configuration is wrong", "For LDAPS, validate the certificate chain and hostname; do not disable TLS validation as a workaround"],
    validation: ["Run connection validation from the same runtime path", "Run a small, scoped aggregation and confirm expected records are returned", "Review connector logs for a clean bind and completed search"]
  },
  {
    id: "ad-invalid-credentials", connector: "Active Directory", category: "Authentication",
    title: "AD bind fails with invalid credentials or insufficient access",
    symptom: "The connector reaches the domain controller but bind or directory searches fail with an authentication or access-denied response.",
    causes: ["Service-account password is expired, rotated or entered incorrectly", "Bind identity format is incorrect for the directory", "The service account lacks permissions for the requested search or update operation"],
    checks: ["Confirm the bind identity format expected by the connector (DN, UPN or domain\\user)", "Verify credential rotation and secret-vault synchronization without exposing the password", "Review directory ACLs for the exact OU and attributes involved", "Separate read/search permission failures from write/provisioning permission failures"],
    resolution: ["Update the managed secret through the approved credential process", "Correct the bind identity format", "Grant least-privilege directory permissions for the required operations and OUs"],
    validation: ["Retest bind and a read-only search", "Test a controlled operation in a non-production OU", "Confirm no credentials are present in logs or diagnosis notes"]
  },
  {
    id: "sap-hana-connection-reset", connector: "SAP HANA", category: "Connectivity",
    title: "SAP HANA JDBC connection reset",
    symptom: "A JDBC connection attempt fails with a connection reset or the peer closes the connection.",
    causes: ["Network path, firewall or listener availability issue", "Incorrect host, instance-specific port or JDBC URL", "TLS or database-side connection policy rejects the client"],
    checks: ["Verify DNS and TCP reachability to the approved HANA host and port", "Confirm the JDBC URL, tenant/database target and port against the DBA-provided connection details", "Check HANA service availability and database-side connection logs at the same timestamp", "Review TLS requirements and JDBC driver compatibility"],
    resolution: ["Restore network access or correct the endpoint details with the database/network owners", "Use the supported JDBC driver and connection properties for the target HANA version", "Align TLS configuration with the database security policy"],
    validation: ["Retest from the connector execution environment", "Run a least-privilege read-only query", "Re-run the relevant Saviynt job and compare timestamps with HANA-side logs"]
  },
  {
    id: "sap-hana-password-sync", connector: "SAP HANA", category: "Password Sync",
    title: "SAP HANA password change fails",
    symptom: "Password synchronization fails even though the endpoint is reachable, often with a JDBC SQL or password-policy error.",
    causes: ["Password-change statement or connector JSON is malformed", "The generated password violates HANA password policy", "The target account is locked, inactive or not permitted to change its password"],
    checks: ["Capture the exact database error and identify whether it is SQL syntax, policy, account state or authorization", "Validate the password-change statement and JSON escaping using the connector's documented format", "Check target account status and password policy with the HANA administrator", "Test special-character handling securely without placing real passwords in tickets or logs"],
    resolution: ["Correct the statement and JSON escaping for the configured connector version", "Generate a password that complies with the target policy", "Resolve account state or grant only the required password-change privilege"],
    validation: ["Test with a designated non-production account", "Confirm the target accepts the new credential through an approved secure test", "Verify the Saviynt task status and ensure secrets are masked"]
  },
  {
    id: "jdbc-aggregation-incomplete", connector: "JDBC", category: "Aggregation",
    title: "JDBC aggregation returns fewer records than expected",
    symptom: "The job completes but only a subset of source records is imported.",
    causes: ["Query filters or delta watermark exclude records", "Pagination or fetch-size handling is incomplete", "The service account cannot read all required rows", "A join or result-set mapping removes or rejects records"],
    checks: ["Compare source count, query count, fetched count, processed count and rejected count", "Run the configured query directly with the same service account and parameters", "Inspect delta attributes, date/time zones and last-successful watermark", "Check pagination, ordering and stable unique keys", "Review attribute mapping and rejected-record details"],
    resolution: ["Correct the filter or delta watermark only after confirming the intended scope", "Implement deterministic pagination using a stable sort key where required", "Grant least-privilege SELECT access to the required views/tables", "Correct result-set aliases and correlation mapping"],
    validation: ["Reconcile counts for a controlled sample", "Run a full or scoped aggregation as appropriate", "Confirm repeat runs do not create duplicate or missing accounts"]
  },
  {
    id: "rest-401-403", connector: "REST", category: "Authentication",
    title: "REST connector returns HTTP 401 or 403",
    symptom: "API calls fail with 401 Unauthorized or 403 Forbidden.",
    causes: ["Token is expired, malformed or issued for the wrong audience", "Required API scope or role is missing", "Authorization header or token prefix is incorrect", "The API client is restricted by source IP or policy"],
    checks: ["Inspect status code and sanitized response body; never paste bearer tokens into tickets", "Verify token endpoint, grant type, audience, expiry and clock skew", "Compare required API scopes/roles with the client registration", "Check header format and any source-IP allowlist"],
    resolution: ["Correct token acquisition and refresh handling", "Request only the documented scopes/roles needed by the integration", "Correct authorization header construction and approved network allowlisting"],
    validation: ["Call a low-risk read endpoint with a fresh token", "Confirm expected status and response schema", "Re-run aggregation or provisioning and inspect sanitized logs"]
  },
  {
    id: "rest-pagination", connector: "REST", category: "Aggregation",
    title: "REST aggregation misses records across pages",
    symptom: "Only the first page or an inconsistent subset of API records is aggregated.",
    causes: ["Next-page link, cursor or offset is not followed", "Pagination parameters or page-size limits are incorrect", "The source changes while offset pagination is running", "Rate limiting interrupts later pages"],
    checks: ["Inspect response envelope for next link, cursor, total count or continuation token", "Confirm the connector pagination configuration matches the API contract", "Check HTTP status and retry-after headers for throttling", "Compare page counts and verify a stable ordering/cursor"],
    resolution: ["Configure the documented pagination mechanism and termination condition", "Use cursor-based pagination where the API supports it", "Apply bounded retries and backoff for rate limits without creating duplicate pages"],
    validation: ["Test a dataset spanning multiple pages", "Reconcile unique IDs against the source count", "Confirm repeated runs do not skip or duplicate records"]
  },
  {
    id: "scim-409", connector: "SCIM", category: "Provisioning",
    title: "SCIM provisioning returns HTTP 409 conflict",
    symptom: "Create or update requests fail with a conflict response, often because a unique attribute already exists.",
    causes: ["A user with the same userName or other unique attribute already exists", "The connector is using the wrong create-versus-update operation", "The correlation key does not match the target resource"],
    checks: ["Read the sanitized SCIM errorType and detail fields", "Search the target using the unique attribute and inspect the existing resource ID", "Verify correlation and attribute normalization, including case and whitespace", "Check whether the request is POST, PUT or PATCH as intended"],
    resolution: ["Correct the correlation mapping so existing resources are updated rather than recreated", "Resolve genuine duplicate identities through the target application's approved process", "Use the SCIM resource ID for subsequent updates"],
    validation: ["Repeat a controlled create/update test", "Confirm exactly one target resource exists for the identity", "Verify returned resource ID and final attribute values"]
  },
  {
    id: "sftp-timeout", connector: "SFTP", category: "Connectivity",
    title: "SFTP connection times out",
    symptom: "File transfer fails with a connection timeout or an SSH connection exception.",
    causes: ["DNS or route to the SFTP host is unavailable", "Firewall blocks the configured SSH port", "The SFTP service is down or restricted by source IP"],
    checks: ["Resolve the SFTP hostname from the connector runtime", "Test TCP reachability to the configured SSH port (commonly 22, but confirm the endpoint)", "Confirm source IP allowlisting and server availability with the SFTP owner", "Check whether the timeout occurs before SSH handshake or during file transfer"],
    resolution: ["Restore the network path and approved source-IP allowlisting", "Correct the hostname or port using the service owner's details", "Coordinate server-side capacity or timeout changes with the SFTP owner"],
    validation: ["Establish an SSH/SFTP session from the same runtime network", "List the approved remote directory", "Transfer a harmless test file and confirm the expected pickup/archive behaviour"]
  },
  {
    id: "workday-incomplete", connector: "Workday", category: "Data Mapping",
    title: "Workday worker attributes are missing or stale",
    symptom: "Worker aggregation succeeds but selected attributes are blank, outdated or mapped to the wrong Saviynt fields.",
    causes: ["The integration user lacks access to the required Workday domains or fields", "The report/API response omits optional or secured fields", "JSON/XML path or attribute mapping does not match the actual response", "Effective-date or pagination behaviour excludes the expected worker data"],
    checks: ["Inspect a sanitized source response for one affected worker", "Compare source field names and paths with Saviynt attribute mappings", "Verify integration-system security permissions for the required domains", "Check effective dates, worker status filters and pagination"],
    resolution: ["Grant the integration user only the required domain permissions", "Correct response paths and target attribute mappings", "Align effective-date and worker-selection filters with the integration design"],
    validation: ["Aggregate a small approved worker sample", "Compare source and Saviynt values field by field", "Confirm a subsequent change is reflected as expected"]
  }
];

\nfunction Labs() {
  const [open, setOpen] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [practiceOpen, setPracticeOpen] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [diagnosisDraft, setDiagnosisDraft] = useState<Record<string, string>>({});
  const [guideSearch, setGuideSearch] = useState("");
  const [guideCategory, setGuideCategory] = useState("All");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const guideCategories = useMemo(() => ["All", ...Array.from(new Set(TROUBLESHOOTING_GUIDE.map((entry) => entry.connector)))], []);
  const filteredGuide = useMemo(() => {
    const term = guideSearch.trim().toLowerCase();
    return TROUBLESHOOTING_GUIDE.filter((entry) => {
      const matchesCategory = guideCategory === "All" || entry.connector === guideCategory;
      const searchable = [entry.connector, entry.category, entry.title, entry.symptom, ...entry.causes, ...entry.checks, ...entry.resolution].join(" ").toLowerCase();
      return matchesCategory && (!term || searchable.includes(term));
    });
  }, [guideSearch, guideCategory]);
  const queryClient = useQueryClient();

  const { data: labRows = [], isLoading } = useQuery({
    queryKey: ["labs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("labs").select("*").eq("published", true).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: userData } = useQuery({
    queryKey: ["lab-progress-user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });
  const userId = userData?.id;
  const { data: savedProgress = [] } = useQuery({
    queryKey: ["lab-progress", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_progress").select("*").eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const progressByLab = useMemo(() => Object.fromEntries(savedProgress.map((p) => [p.lab_id, p as Progress])), [savedProgress]);
  const saveProgress = useMutation({
    mutationFn: async (value: Progress) => {
      if (!userId) throw new Error("Please sign in again to save lab progress.");
      const { error } = await supabase.from("lab_progress").upsert({
        user_id: userId, lab_id: value.lab_id, completed_steps: value.completed_steps,
        diagnosis: value.diagnosis, score: value.score, completed: value.completed,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,lab_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lab-progress", userId] }),
    onError: (error) => toast.error(error.message || "Unable to save progress."),
  });

  const labs: Lab[] = labRows.map((row) => ({
    id: row.id, title: row.title, area: row.area, difficulty: row.difficulty,
    symptom: row.symptom, root_cause: row.root_cause, fix: row.fix,
    steps: Array.isArray(row.steps) ? row.steps as string[] : [],
  }));
  const completedCount = savedProgress.filter((p) => p.completed).length;
  const totalScore = savedProgress.reduce((sum, p) => sum + (p.score ?? 0), 0);
  const hintFor = (area: string) => HINTS[Object.keys(HINTS).find((key) => area.toLowerCase().includes(key.toLowerCase())) ?? ""] ?? "Establish the expected behaviour, reproduce the issue, isolate the failing layer, collect timestamped logs and validate the fix with a controlled retest.";

  function update(lab: Lab, changes: Partial<Progress>) {
    const current = progressByLab[lab.id] ?? { lab_id: lab.id, completed_steps: [], diagnosis: "", score: 0, completed: false };
    const next = { ...current, ...changes };
    const stepCount = Math.max(lab.steps.length, 1);
    const score = Math.round((next.completed_steps.length / stepCount) * 70 + (next.diagnosis.trim().length >= 80 ? 30 : 0));
    const completed = next.completed_steps.length === stepCount && next.diagnosis.trim().length >= 80;
    saveProgress.mutate({ ...next, score: Math.min(score, 100), completed });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Interactive Saviynt Hands-on Labs" subtitle="Practise implementation, connector configuration and production-style incident diagnosis. Progress is saved to your learner account." />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Available scenarios</p><p className="mt-1 text-2xl font-semibold">{labs.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Completed labs</p><p className="mt-1 text-2xl font-semibold">{completedCount}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Accumulated score</p><p className="mt-1 text-2xl font-semibold">{totalScore}</p></div>
      </div>

      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold">Guided troubleshooting scenarios</h2><p className="text-sm text-muted-foreground">Complete the investigation checklist and document your diagnosis to earn a score.</p></div>
        {isLoading && <p className="text-sm text-muted-foreground">Loading labs…</p>}
        {!isLoading && labs.length === 0 && <p className="rounded-xl border p-5 text-sm text-muted-foreground">No published labs are available yet. Ask your portal administrator to publish lab scenarios.</p>}
        {labs.map((lab) => {
          const saved = progressByLab[lab.id] ?? { lab_id: lab.id, completed_steps: [], diagnosis: "", score: 0, completed: false };
          const expanded = open === lab.id;
          return (
            <article key={lab.id} className="rounded-xl border bg-card p-5 shadow-card">
              <button className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setOpen(expanded ? null : lab.id)} aria-expanded={expanded}>
                <span><span className="font-semibold">{lab.title}</span><span className="mt-1 block text-sm text-muted-foreground">{lab.symptom}</span></span>
                <span className="flex shrink-0 items-center gap-2">{saved.completed && <Badge><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>}<Badge variant="secondary">{lab.area}</Badge><Badge variant="outline">{lab.difficulty}</Badge>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
              </button>
              {expanded && <div className="mt-5 space-y-5 border-t pt-5">
                <div><h3 className="font-medium">Investigation checklist</h3><p className="mb-3 text-xs text-muted-foreground">Tick each action after you have completed or reasoned through it.</p>
                  {lab.steps.length ? <ol className="space-y-2">{lab.steps.map((step, index) => <li key={index} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={saved.completed_steps.includes(step)} onChange={(event) => { const next = event.target.checked ? [...saved.completed_steps, step] : saved.completed_steps.filter((item) => item !== step); update(lab, { completed_steps: next }); }} /><span>{step}</span></li>)}</ol> : <p className="text-sm text-muted-foreground">No checklist steps have been configured for this scenario.</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowHint((state) => ({ ...state, [lab.id]: !state[lab.id] }))}><Lightbulb className="mr-2 h-4 w-4" />{showHint[lab.id] ? "Hide hint" : "Show hint"}</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSolution((state) => ({ ...state, [lab.id]: !state[lab.id] }))}>{showSolution[lab.id] ? "Hide solution" : "Reveal solution"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => update(lab, { completed_steps: [], diagnosis: "" })}><RotateCcw className="mr-2 h-4 w-4" />Reset progress</Button>
                </div>
                {showHint[lab.id] && <div className="rounded-lg bg-muted p-3 text-sm"><p className="mb-1 font-medium">Investigation hint</p>{hintFor(lab.area)}</div>}
                <div><label className="mb-2 block text-sm font-medium" htmlFor={`diagnosis-${lab.id}`}>Your diagnosis and remediation plan</label><Textarea id={`diagnosis-${lab.id}`} rows={5} placeholder="Document the evidence you would collect, likely root cause, corrective action and validation steps…" value={diagnosisDraft[lab.id] ?? saved.diagnosis} onChange={(event) => setDiagnosisDraft((state) => ({ ...state, [lab.id]: event.target.value }))} /></div>
                {showSolution[lab.id] && <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"><p><strong>Root cause:</strong> {lab.root_cause}</p><p><strong>Recommended fix:</strong> {lab.fix}</p></div>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div className="text-sm"><span className="font-semibold">Score: {saved.score}/100</span><span className="ml-2 text-muted-foreground">{saved.completed ? "Lab completed" : "Complete checklist + write an 80-character diagnosis to finish"}</span></div><Button size="sm" onClick={() => { update(lab, { diagnosis: diagnosisDraft[lab.id] ?? saved.diagnosis }); setDiagnosisDraft((state) => { const next = { ...state }; delete next[lab.id]; return next; }); }} disabled={saveProgress.isPending}>Save progress</Button></div>
              </div>}
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold">Technical practice stations</h2><p className="text-sm text-muted-foreground">Structured exercises for SQL, connector JSON and incident triage. These exercises are self-reviewed and do not require AI calls.</p></div>
        {PRACTICE.map((item) => <article key={item.title} className="rounded-xl border bg-card p-4"><button className="flex w-full items-center justify-between text-left" onClick={() => setPracticeOpen(practiceOpen === item.title ? null : item.title)}><span><span className="font-medium">{item.title}</span><span className="block text-xs text-muted-foreground">{item.area}</span></span>{practiceOpen === item.title ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>{practiceOpen === item.title && <div className="mt-3 space-y-3"><p className="text-sm">{item.prompt}</p><Textarea rows={4} placeholder="Write your approach here…" value={practiceAnswers[item.title] ?? ""} onChange={(event) => setPracticeAnswers((state) => ({ ...state, [item.title]: event.target.value }))} /><details className="rounded-lg bg-muted p-3 text-sm"><summary className="cursor-pointer font-medium">Show guidance</summary><p className="mt-2">{item.hint}</p></details></div>}</article>)}
      </section>
      <div className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground"><Trophy className="h-4 w-4 shrink-0" />Scores reflect checklist completion and the presence of a written diagnosis, not an AI assessment of technical correctness. Use fictional data only; never enter client names, credentials or confidential production information.</div>
    </div>
  );
}

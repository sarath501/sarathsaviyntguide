import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Cloud, Database, GitBranch, Layers3, Play, RotateCcw, ShieldCheck, Workflow } from "lucide-react";

export const Route = createFileRoute("/_authenticated/implementation-simulator")({ component: ImplementationSimulator });

type Stage = {
  id: number;
  title: string;
  objective: string;
  deliverable: string;
  task: string;
  options: string[];
  correct: number;
  explanation: string;
  checklist: string[];
};

const STAGES: Stage[] = [
  {
    id: 1, title: "Requirements & discovery", objective: "Establish scope, stakeholders, source-of-truth systems and measurable acceptance criteria.",
    deliverable: "Signed requirements matrix and application inventory",
    task: "The business wants joiner, mover and leaver automation. What should you confirm first?",
    options: ["Start configuring provisioning workflows immediately", "Identify authoritative identity sources, lifecycle events, owners, target applications and acceptance criteria", "Import every account from every application before defining scope"],
    correct: 1,
    explanation: "Discovery establishes the authoritative source, event triggers, ownership, scope, data quality, controls and acceptance criteria before design or configuration begins.",
    checklist: ["Identify HR/source-of-truth system and identity owners", "Inventory applications, owners, environments and criticality", "Document joiner, mover, leaver and rehire requirements", "Agree scope, assumptions, dependencies and acceptance criteria"],
  },
  {
    id: 2, title: "Architecture & environment design", objective: "Define the EIC tenant, connectivity, environments, network paths, service accounts and operational boundaries.",
    deliverable: "Approved logical architecture and connectivity matrix",
    task: "A target application is reachable only from a private network. What is the correct design action?",
    options: ["Expose the application database to the public internet", "Use an approved private connectivity pattern or gateway/agent supported by the connector and validate network paths", "Share an administrator's personal credentials with the implementation team"],
    correct: 1,
    explanation: "Connectivity must follow the platform's supported integration pattern and enterprise security controls. Validate DNS, routes, ports, TLS, service identity and environment separation.",
    checklist: ["Document EIC tenant and environment strategy", "Map source, target, connector and network paths", "Validate DNS, ports, TLS certificates and firewall rules", "Define service-account ownership, vaulting and rotation"],
  },
  {
    id: 3, title: "Application onboarding", objective: "Model each application, endpoint, owner, account type and supported integration operations.",
    deliverable: "Application onboarding specification",
    task: "Before configuring a JDBC application, which information is essential?",
    options: ["Only the application display name and logo", "Connection details, driver/support requirements, account and entitlement data model, read queries and provisioning operations", "A production administrator password pasted into a shared document"],
    correct: 1,
    explanation: "A JDBC integration needs validated connectivity and a clear data/provisioning contract. Store credentials securely and test in a non-production environment first.",
    checklist: ["Confirm application owner and technical contact", "Define endpoint and account/entitlement objects", "Document aggregation and provisioning capabilities", "Record test identities and expected source/target results"],
  },
  {
    id: 4, title: "Connector configuration", objective: "Configure and validate connector-specific connection, aggregation and provisioning settings.",
    deliverable: "Connector configuration workbook and connection test evidence",
    task: "An AD connector returns UnknownHostException. What is the best first diagnostic?",
    options: ["Change the user's password policy", "Validate hostname/FQDN resolution from the connector runtime and confirm DNS/network reachability", "Delete the endpoint and recreate all identities"],
    correct: 1,
    explanation: "UnknownHostException indicates name resolution failure. Check the configured hostname, DNS records, resolver path and network context before changing credentials or mappings.",
    checklist: ["Select the supported connector and required capabilities", "Validate endpoint URL/host, port, TLS and authentication", "Test connection from the actual connector runtime", "Capture safe logs and confirm aggregation/provisioning test results"],
  },
  {
    id: 5, title: "Identity data & attribute mapping", objective: "Map authoritative source attributes to identity attributes with normalization and data-quality rules.",
    deliverable: "Attribute mapping and transformation specification",
    task: "The HR feed provides employeeStatus values 'A', 'L' and 'T'. What should happen before lifecycle rules use them?",
    options: ["Assume every non-empty value means active", "Agree and document the source-code meaning, normalize values and validate null/unknown cases with HR", "Map the raw value to a manager attribute"],
    correct: 1,
    explanation: "Lifecycle logic depends on accurate semantics. Confirm the source system's code set, normalize values, define unknown/null handling and test representative records with the data owner.",
    checklist: ["Map unique identity key and required identity attributes", "Define normalization, transformations and fallback handling", "Validate manager, department, location and employment status", "Test duplicates, nulls, rehires and out-of-order events"],
  },
  {
    id: 6, title: "Account aggregation & correlation", objective: "Import accounts and entitlements, correlate accounts to identities and handle unmatched records.",
    deliverable: "Aggregation schedule and correlation test evidence",
    task: "Two identities share the same display name. Which correlation key is generally safer when it is governed and unique?",
    options: ["Display name", "A stable unique employee identifier that is consistently populated in both systems", "The order in which records appear in the import file"],
    correct: 1,
    explanation: "Correlation should use a stable, unique and governed identifier. Validate uniqueness and lifecycle behavior; define controlled handling for unmatched or ambiguous accounts.",
    checklist: ["Define account and entitlement aggregation scope", "Select stable correlation keys and matching precedence", "Test matched, unmatched, duplicate and orphan accounts", "Validate reconciliation counts and schedule ownership"],
  },
  {
    id: 7, title: "Access requests & approvals", objective: "Design requestable access, forms, policy checks, approval routing and fulfillment.",
    deliverable: "Request workflow design and approval matrix",
    task: "A finance entitlement requires manager and application-owner approval. Where should these controls be enforced?",
    options: ["Only in an informal email outside the request record", "In the governed request workflow with defined approvers, policy checks and auditable outcomes", "By giving all requesters direct target-system administrator access"],
    correct: 1,
    explanation: "Approval routing and policy controls belong in the governed workflow so decisions, timestamps, approvers and fulfillment status can be audited.",
    checklist: ["Define requestable roles/entitlements and eligibility", "Configure forms, required fields and validation", "Map manager, application-owner and risk-based approvals", "Test denial, delegation, timeout and fulfillment paths"],
  },
  {
    id: 8, title: "Provisioning & lifecycle automation", objective: "Validate create, update, disable and removal operations for joiner, mover, leaver and rehire events.",
    deliverable: "Lifecycle test matrix and provisioning evidence",
    task: "A mover changes from Sales to Finance. What is the safest access design?",
    options: ["Keep all previous access and add all Finance access permanently", "Re-evaluate role and policy eligibility, add required access and remove access no longer justified", "Disable the identity and create a second identity without checking correlation"],
    correct: 1,
    explanation: "Mover processing should reconcile access against the new job context. Use controlled add/remove sequencing, exception handling and post-provisioning verification.",
    checklist: ["Test joiner create and birthright access", "Test mover access addition and removal", "Test leaver disable/deprovisioning and rehire handling", "Verify target-side changes and retry/error handling"],
  },
  {
    id: 9, title: "Governance, certification & SoD", objective: "Define review scope, reviewer assignment, decision evidence, remediation and SoD controls.",
    deliverable: "Certification and SoD control design",
    task: "A reviewer does not respond to a high-risk access certification. What is the correct response?",
    options: ["Automatically treat silence as approval", "Apply the configured escalation and overdue-review policy; retain decision evidence", "Delete the certification record"],
    correct: 1,
    explanation: "Non-response must follow the organization's documented campaign policy. High-risk access needs accountable review, escalation and traceable remediation.",
    checklist: ["Define campaign population, cadence and reviewers", "Set Keep/Revoke/Delegate/Escalate policy and evidence rules", "Map SoD rules, risk owners and exception process", "Test revocation fulfillment and remediation closure"],
  },
  {
    id: 10, title: "Testing, cutover & hypercare", objective: "Execute end-to-end tests, obtain sign-offs, plan cutover and establish operational support.",
    deliverable: "UAT sign-off, go-live checklist and hypercare runbook",
    task: "A production cutover is scheduled, but a critical leaver test failed in UAT. What should the project team do?",
    options: ["Proceed and fix it after go-live without informing stakeholders", "Assess severity, resolve and retest the control, document risk and obtain the required go/no-go approval", "Delete the failed test evidence"],
    correct: 1,
    explanation: "A failed critical control is a go-live risk. Resolve and retest it, document evidence and residual risk, and follow formal change and go/no-go governance.",
    checklist: ["Complete positive, negative, volume and failure-path tests", "Obtain business, application-owner and security sign-offs", "Approve cutover, rollback and change windows", "Publish monitoring, support ownership and hypercare exit criteria"],
  },
];

const STORAGE_KEY = "sarath-iga-implementation-simulator-v1";
type SavedProgress = { answers: Record<number, number>; completed: number[] };

function ImplementationSimulator() {
  const [activeStage, setActiveStage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [completed, setCompleted] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const stage = STAGES[activeStage];
  const isComplete = completed.includes(stage.id);
  const selected = answers[stage.id];
  const score = useMemo(() => STAGES.filter(item => completed.includes(item.id) && answers[item.id] === item.correct).length, [answers, completed]);
  const progress = Math.round(completed.length / STAGES.length * 100);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as SavedProgress;
        if (saved && typeof saved.answers === "object" && Array.isArray(saved.completed)) {
          setAnswers(saved.answers);
          setCompleted(saved.completed.filter(id => STAGES.some(item => item.id === id)));
        }
      }
    } catch {
      // Ignore unavailable or malformed local progress and start a fresh practice.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, completed }));
      } catch {
        // The simulator remains usable if browser storage is unavailable.
      }
    }
  }, [answers, completed, hydrated]);

  function submitStage() {
    if (selected === undefined) return;
    setCompleted(previous => previous.includes(stage.id) ? previous : [...previous, stage.id]);
  }

  function resetProgress() {
    setAnswers({});
    setCompleted([]);
    setActiveStage(0);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore unavailable storage */ }
  }

  return <div className="space-y-6">
    <PageHeader title="End-to-End Implementation Simulator" subtitle="Work through a fictional Saviynt EIC implementation, from discovery and architecture to go-live and hypercare." action={<Button variant="outline" onClick={resetProgress}><RotateCcw className="mr-2 h-4 w-4"/>Reset project</Button>} />

    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><Badge variant="outline">Fictional enterprise project</Badge><h2 className="mt-2 text-xl font-semibold">Northstar Manufacturing Group</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Implement identity governance for a global workforce using Workday as the authoritative HR source and Saviynt EIC to govern access across directory, ERP and business applications.</p></div>
        <div className="rounded-xl bg-primary/10 p-3 text-primary"><Workflow className="h-7 w-7"/></div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Authoritative source</p><p className="mt-1 font-semibold">Workday</p></div>
        <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">IGA platform</p><p className="mt-1 font-semibold">Saviynt EIC</p></div>
        <div className="rounded-xl bg-muted/60 p-3"><p className="text-xs text-muted-foreground">Target systems</p><p className="mt-1 font-semibold">AD · SAP · Oracle</p></div>
      </div>
      <div className="mt-4 rounded-xl border p-4">
        <div className="flex items-center gap-2 text-sm font-semibold"><Cloud className="h-4 w-4 text-primary"/>Reference integration flow</div>
        <div className="mt-3 grid items-center gap-2 text-center text-xs sm:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <div className="rounded-lg bg-muted p-3"><Database className="mx-auto mb-1 h-5 w-5"/>Workday<br/><span className="text-muted-foreground">HR source</span></div>
          <ArrowRight className="mx-auto hidden h-4 w-4 sm:block"/>
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3"><Layers3 className="mx-auto mb-1 h-5 w-5 text-primary"/>Saviynt EIC<br/><span className="text-muted-foreground">Identity governance</span></div>
          <ArrowRight className="mx-auto hidden h-4 w-4 sm:block"/>
          <div className="rounded-lg bg-muted p-3"><GitBranch className="mx-auto mb-1 h-5 w-5"/>AD · SAP · Oracle<br/><span className="text-muted-foreground">Target applications</span></div>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Conceptual flow only. Actual connector topology, supported capabilities and network architecture must be confirmed for each customer environment.</p>
      </div>
    </section>

    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-semibold">Project completion</p><p className="text-xs text-muted-foreground">{completed.length} of {STAGES.length} stages completed · Best score {score}/{STAGES.length}</p></div><Badge variant={progress===100?"default":"secondary"}>{progress}% complete</Badge></div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{width:progress+"%"}}/></div>
      <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
        {STAGES.map((item,index)=><button key={item.id} type="button" onClick={()=>setActiveStage(index)} aria-label={"Open stage "+item.id+": "+item.title} aria-current={index===activeStage?"step":undefined} className={"flex h-9 items-center justify-center rounded-lg border text-xs font-semibold transition "+(index===activeStage?"border-primary bg-primary text-primary-foreground":completed.includes(item.id)?"border-emerald-500/40 bg-emerald-500/10 text-emerald-700":"bg-background text-muted-foreground hover:bg-muted")}>{completed.includes(item.id)?<CheckCircle2 className="h-4 w-4"/>:item.id}</button>)}
      </div>
    </section>

    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline">Stage {stage.id} of {STAGES.length}</Badge>{isComplete&&<Badge variant="secondary"><CheckCircle2 className="mr-1 h-3 w-3"/>Completed</Badge>}</div>
      <h2 className="mt-3 text-xl font-semibold">{stage.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{stage.objective}</p>
      <div className="mt-4 rounded-xl bg-muted/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expected deliverable</p><p className="mt-1 text-sm font-medium">{stage.deliverable}</p></div>
      <div className="mt-5"><h3 className="flex items-center gap-2 font-semibold"><ClipboardList className="h-4 w-4 text-primary"/>Implementation checklist</h3><ul className="mt-3 space-y-2">{stage.checklist.map(item=><li key={item} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary/70"/><span>{item}</span></li>)}</ul></div>
      <div className="mt-6 border-t pt-5">
        <div className="flex items-center gap-2"><Play className="h-4 w-4 text-primary"/><h3 className="font-semibold">Decision checkpoint</h3></div>
        <p className="mt-2 text-sm leading-6">{stage.task}</p>
        <div className="mt-3 space-y-2">{stage.options.map((option,index)=><button key={option} type="button" disabled={isComplete} onClick={()=>setAnswers(previous=>({...previous,[stage.id]:index}))} aria-pressed={selected===index} className={"w-full rounded-xl border p-3 text-left text-sm transition "+(selected===index?"border-primary bg-primary/5 ring-1 ring-primary/30":"hover:bg-muted")+" disabled:cursor-default"}><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold">{String.fromCharCode(65+index)}</span>{option}</button>)}</div>
        {isComplete&&<div className="mt-4 rounded-xl border bg-muted/50 p-4"><div className="flex items-center gap-2 font-semibold">{answers[stage.id]===stage.correct?<CheckCircle2 className="h-5 w-5 text-emerald-600"/>:<AlertTriangle className="h-5 w-5 text-amber-600"/>}{answers[stage.id]===stage.correct?"Correct decision":"Review the recommended approach"}</div><p className="mt-2 text-sm leading-6">{stage.explanation}</p></div>}
        {!isComplete&&<div className="mt-4 flex justify-end"><Button onClick={submitStage} disabled={selected===undefined}>Submit decision</Button></div>}
      </div>
      <div className="mt-6 flex flex-wrap justify-between gap-2 border-t pt-4">
        <Button variant="outline" onClick={()=>setActiveStage(index=>Math.max(0,index-1))} disabled={activeStage===0}><ArrowLeft className="mr-2 h-4 w-4"/>Previous stage</Button>
        <Button onClick={()=>setActiveStage(index=>Math.min(STAGES.length-1,index+1))} disabled={activeStage===STAGES.length-1}>Next stage<ArrowRight className="ml-2 h-4 w-4"/></Button>
      </div>
    </section>
    {progress===100&&<section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5"><div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-emerald-600"/>Implementation simulation completed</div><p className="mt-2 text-sm text-muted-foreground">You completed all ten decision checkpoints and scored {score}/{STAGES.length}. Review any incorrect decisions and use the deliverables as a project-planning reference, not as a production implementation specification.</p></section>}
    <p className="text-xs text-muted-foreground">Progress is saved in this browser only. This simulator uses fictional scenarios and local scoring; it does not connect to Saviynt, Workday, Active Directory, SAP, Oracle or any customer environment. No database, learner records or access permissions are changed.</p>
  </div>;
}

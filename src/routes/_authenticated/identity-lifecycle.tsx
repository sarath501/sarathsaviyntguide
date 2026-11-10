import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleAlert, GitCompareArrows, Play, RotateCcw, UserRound, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/identity-lifecycle")({ component: IdentityLifecycleSimulator });

type EventType = "Joiner" | "Mover" | "Leaver" | "Rehire";
type Identity = { name: string; department: string; location: string; employeeType: string; status: string; manager: string };
type AccessItem = { name: string; reason: string; source: string };

const baseline: Identity = { name: "Alex Morgan", department: "Sales", location: "Bengaluru", employeeType: "Employee", status: "Active", manager: "Priya Sharma" };
const options = {
  departments: ["Sales", "Finance", "Human Resources", "IT", "Procurement"],
  locations: ["Bengaluru", "Chennai", "Hyderabad", "Pune"],
  employeeTypes: ["Employee", "Contractor", "Intern"],
};

function accessFor(identity: Identity): AccessItem[] {
  if (identity.status !== "Active") return [];
  const items: AccessItem[] = [
    { name: "Corporate Identity", reason: "Baseline identity access for active workforce identities", source: "Birthright baseline" },
    { name: "Collaboration Suite", reason: "Standard collaboration access for active identities", source: "Birthright baseline" },
  ];
  if (identity.location === "Bengaluru") items.push({ name: "Bengaluru Office Resources", reason: "Location-based access eligibility", source: "Location rule" });
  if (identity.employeeType === "Contractor") items.push({ name: "Contractor Portal", reason: "Contractor-specific access package", source: "Worker-type rule" });
  if (identity.employeeType === "Employee" && identity.department === "Sales") items.push({ name: "CRM Sales User", reason: "Sales department access", source: "Department rule" }, { name: "Sales Analytics Reader", reason: "Read-only sales reporting access", source: "Department rule" });
  if (identity.employeeType === "Employee" && identity.department === "Finance") items.push({ name: "Finance ERP User", reason: "Finance department access", source: "Department rule" }, { name: "Finance Reports", reason: "Finance reporting access", source: "Department rule" });
  if (identity.employeeType === "Employee" && identity.department === "IT") items.push({ name: "IT Service Desk", reason: "IT department access", source: "Department rule" });
  if (identity.department === "Procurement") items.push({ name: "Procurement Workspace", reason: "Procurement department access", source: "Department rule" });
  return items;
}

function IdentityLifecycleSimulator() {
  const [event, setEvent] = useState<EventType>("Joiner");
  const [before, setBefore] = useState<Identity>(baseline);
  const [after, setAfter] = useState<Identity>({ ...baseline, department: "Finance" });
  const [hasRun, setHasRun] = useState(false);

  const oldAccess = useMemo(() => accessFor(before), [before]);
  const newAccess = useMemo(() => accessFor(after), [after]);
  const result = useMemo(() => {
    const oldNames = new Set(oldAccess.map(item => item.name));
    const newNames = new Set(newAccess.map(item => item.name));
    const removed = oldAccess.filter(item => !newNames.has(item.name));
    const added = newAccess.filter(item => !oldNames.has(item.name));
    const retained = newAccess.filter(item => oldNames.has(item.name));
    return { removed, added, retained };
  }, [oldAccess, newAccess]);

  function setField(field: keyof Identity, value: string) {
    setAfter(current => ({ ...current, [field]: value }));
    setHasRun(false);
  }
  function chooseEvent(next: EventType) {
    setEvent(next);
    setHasRun(false);
    if (next === "Joiner") {
      setBefore({ ...baseline, status: "Not Created" });
      setAfter({ ...baseline, department: "Sales", status: "Active" });
    } else if (next === "Mover") {
      setBefore({ ...baseline, department: "Sales" });
      setAfter({ ...baseline, department: "Finance" });
    } else if (next === "Leaver") {
      setBefore({ ...baseline, status: "Active" });
      setAfter({ ...baseline, status: "Inactive" });
    } else {
      setBefore({ ...baseline, status: "Terminated" });
      setAfter({ ...baseline, status: "Active" });
    }
  }
  function reset() {
    setEvent("Joiner");
    setBefore({ ...baseline, status: "Not Created" });
    setAfter({ ...baseline, status: "Active" });
    setHasRun(false);
  }

  const summary = event === "Joiner" ? "Evaluate baseline and role-based access for a newly created identity." :
    event === "Mover" ? "Compare existing access with the access justified by the employee's new department or location." :
    event === "Leaver" ? "Identify access that should be disabled or removed when the identity becomes inactive." :
    "Re-evaluate eligible access when a previously terminated worker returns.";

  return <div className="space-y-6">
    <PageHeader title="Identity Lifecycle Simulator" subtitle="Practise Joiner, Mover, Leaver and Rehire scenarios and understand how identity changes affect access." />
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center gap-2"><GitCompareArrows className="h-5 w-5 text-primary"/><h2 className="font-semibold">Lifecycle event simulator</h2></div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a lifecycle event, adjust the identity attributes and simulate the access delta. The scenario uses fictional identities and an illustrative access matrix; it does not connect to Saviynt or provision accounts.</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{(["Joiner","Mover","Leaver","Rehire"] as EventType[]).map(item=><button key={item} type="button" onClick={()=>chooseEvent(item)} className={"rounded-xl border px-3 py-3 text-sm font-semibold "+(event===item?"border-primary bg-primary/10 text-primary":"bg-card hover:bg-muted")}>{item}</button>)}</div>
      <p className="mt-3 text-sm">{summary}</p>
    </div>

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Before the event</h3><Badge variant="outline">Source state</Badge></div>
        <p className="mt-1 text-xs text-muted-foreground">Identity attributes before the lifecycle change</p>
        <div className="mt-4 space-y-3">{(["name","department","location","employeeType","status","manager"] as (keyof Identity)[]).map(field=><div key={field} className="flex items-center justify-between gap-3 border-b pb-2 text-sm"><span className="text-muted-foreground">{field === "employeeType" ? "Worker type" : field[0].toUpperCase()+field.slice(1)}</span><span className="font-medium text-right">{before[field]}</span></div>)}</div>
      </div>
      <div className="rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">After the event</h3><Badge>Target state</Badge></div>
        <p className="mt-1 text-xs text-muted-foreground">Edit attributes to model the new identity state</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-medium text-muted-foreground">Department<select value={after.department} onChange={e=>setField("department",e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground">{options.departments.map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-medium text-muted-foreground">Location<select value={after.location} onChange={e=>setField("location",e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground">{options.locations.map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-medium text-muted-foreground">Worker type<select value={after.employeeType} onChange={e=>setField("employeeType",e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground">{options.employeeTypes.map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-medium text-muted-foreground">Employment status<select value={after.status} onChange={e=>setField("status",e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground">{["Active","Inactive","Terminated","Leave"].map(x=><option key={x}>{x}</option>)}</select></label>
          <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Manager<input value={after.manager} onChange={e=>setField("manager",e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"/></label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={()=>setHasRun(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"><Play className="h-4 w-4"/>Simulate lifecycle</button><button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"><RotateCcw className="h-4 w-4"/>Reset scenario</button></div>
      </div>
    </section>

    {hasRun&&<section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-xl font-semibold">Simulation results</h2><p className="text-sm text-muted-foreground">Illustrative access comparison for {after.name}</p></div><Badge variant="outline">{event} event</Badge></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Access to add</p><p className="mt-1 text-2xl font-semibold">{result.added.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Access to remove</p><p className="mt-1 text-2xl font-semibold">{result.removed.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Access retained</p><p className="mt-1 text-2xl font-semibold">{result.retained.length}</p></div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <AccessList title="Add / provision" items={result.added} kind="add"/>
        <AccessList title="Remove / revoke" items={result.removed} kind="remove"/>
        <AccessList title="Retain" items={result.retained} kind="keep"/>
      </div>
      <div className="rounded-2xl border bg-card p-4 sm:p-5"><h3 className="font-semibold">Recommended Saviynt processing sequence</h3><ol className="mt-3 space-y-2 text-sm leading-6">{["Aggregate or create the identity from the authoritative source (for example, Workday).","Evaluate identity attributes, lifecycle event and applicable Technical/User Update Rules.","Calculate birthright and role/entitlement eligibility; apply request and SoD controls where required.","Generate provisioning or deprovisioning tasks through the configured application connectors.","Verify target account state, reconcile aggregation results and retain audit evidence."].map((item,index)=><li key={item} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index+1}</span><span>{item}</span></li>)}</ol></div>
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><div className="flex items-center gap-2 font-semibold"><CircleAlert className="h-4 w-4 text-amber-600"/>Implementation reminder</div><p className="mt-1 text-sm leading-6 text-muted-foreground">This simulator compares a simplified sample access matrix. Real Saviynt outcomes depend on configured rules, roles, mappings, workflows, connector capabilities, provisioning policies and job schedules. A production leaver process must follow the organization's approved disablement and revocation controls.</p></div>
    </section>}
    <section className="rounded-2xl border bg-card p-4 sm:p-5"><h2 className="font-semibold">What you should learn</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{[{title:"Joiner",text:"How birthright and department-based access are evaluated for a new identity."},{title:"Mover",text:"Why old access must be reassessed when department, location or worker type changes."},{title:"Leaver",text:"Why access removal and account disablement must be treated as time-sensitive controls."},{title:"Rehire",text:"Why a returning worker needs fresh eligibility evaluation rather than blindly restoring old access."}].map(item=><div key={item.title} className="rounded-xl bg-muted/50 p-3"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.text}</p></div>)}</div></section>
    <p className="text-xs text-muted-foreground">Training-only simulation. All names and access objects are fictional. No real identity records, target accounts, Saviynt tenant settings or provisioning actions are accessed or changed.</p>
  </div>;
}

function AccessList({ title, items, kind }: { title: string; items: AccessItem[]; kind: "add" | "remove" | "keep" }) {
  const Icon = kind === "add" ? CheckCircle2 : kind === "remove" ? XCircle : UserRound;
  return <div className="rounded-2xl border bg-card p-4"><h3 className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4"/>{title}<span className="ml-auto text-xs text-muted-foreground">{items.length}</span></h3>{items.length===0?<p className="mt-3 text-sm text-muted-foreground">No access items in this category.</p>:<ul className="mt-3 space-y-3">{items.map(item=><li key={item.name} className="border-b pb-3 last:border-0 last:pb-0"><p className="text-sm font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.reason}</p><Badge variant="outline" className="mt-2">{item.source}</Badge></li>)}</ul>}</div>;
}

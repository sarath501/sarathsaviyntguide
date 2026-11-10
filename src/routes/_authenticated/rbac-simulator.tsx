import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CircleAlert, GitBranch, Layers3, ShieldCheck, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rbac-simulator")({ component: RbacSimulator });

type Entitlement = { id: string; name: string; app: string; risk: "Low" | "Medium" | "High"; function: string };
type Role = { id: string; name: string; kind: "Business" | "IT"; description: string; entitlements: string[] };
type Person = { id: string; name: string; department: string; title: string; roleIds: string[] };

const ENTITLEMENTS: Entitlement[] = [
  { id: "crm-read", name: "CRM Sales Read", app: "Salesforce", risk: "Low", function: "View customer records" },
  { id: "crm-write", name: "CRM Sales Update", app: "Salesforce", risk: "Medium", function: "Update customer records" },
  { id: "erp-ap", name: "AP Invoice Processor", app: "SAP", risk: "High", function: "Process supplier invoices" },
  { id: "erp-vendor", name: "Vendor Master Creator", app: "SAP", risk: "High", function: "Create supplier records" },
  { id: "erp-payment", name: "Payment Approver", app: "SAP", risk: "High", function: "Approve supplier payments" },
  { id: "hr-read", name: "Employee Data Reader", app: "Workday", risk: "Medium", function: "View employee information" },
  { id: "ad-standard", name: "Standard Directory User", app: "Active Directory", risk: "Low", function: "Standard directory access" },
  { id: "it-admin", name: "Server Administrator", app: "Active Directory", risk: "High", function: "Administer servers" },
];

const INITIAL_ROLES: Role[] = [
  { id: "sales", name: "Sales Representative", kind: "Business", description: "Business role for customer-facing sales employees.", entitlements: ["crm-read", "crm-write", "ad-standard"] },
  { id: "finance", name: "Finance Operations", kind: "Business", description: "Business role for finance operations staff.", entitlements: ["erp-ap", "ad-standard"] },
  { id: "vendor", name: "Vendor Management", kind: "Business", description: "Business role for supplier onboarding teams.", entitlements: ["erp-vendor", "ad-standard"] },
  { id: "it-support", name: "IT Support Analyst", kind: "IT", description: "Technical role for support personnel.", entitlements: ["ad-standard", "hr-read"] },
  { id: "server-admin", name: "Server Administration", kind: "IT", description: "Privileged technical role for server administrators.", entitlements: ["it-admin", "ad-standard"] },
];

const PEOPLE: Person[] = [
  { id: "p1", name: "Maya Rao", department: "Sales", title: "Sales Representative", roleIds: ["sales"] },
  { id: "p2", name: "Arjun Mehta", department: "Finance", title: "Finance Analyst", roleIds: ["finance"] },
  { id: "p3", name: "Nina Thomas", department: "IT", title: "IT Support Analyst", roleIds: ["it-support"] },
  { id: "p4", name: "Dev Patel", department: "Finance", title: "Finance Operations Lead", roleIds: ["finance", "vendor"] },
];

function RbacSimulator() {
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [selectedRole, setSelectedRole] = useState("sales");
  const [selectedPerson, setSelectedPerson] = useState("p1");
  const [draftName, setDraftName] = useState("");
  const [draftKind, setDraftKind] = useState<"Business" | "IT">("Business");
  const [draftDescription, setDraftDescription] = useState("");
  const [showBuilder, setShowBuilder] = useState(false);
  const [message, setMessage] = useState("");

  const role = roles.find(item => item.id === selectedRole) ?? roles[0];
  const person = PEOPLE.find(item => item.id === selectedPerson) ?? PEOPLE[0];
  const roleEntitlements = ENTITLEMENTS.filter(item => role.entitlements.includes(item.id));
  const assignedRoles = roles.filter(item => person.roleIds.includes(item.id));
  const assignedEntitlements = ENTITLEMENTS.filter(item => assignedRoles.some(r => r.entitlements.includes(item.id)));
  const hasSodConflict = assignedEntitlements.some(item => item.id === "erp-vendor") && assignedEntitlements.some(item => item.id === "erp-payment");

  const metrics = useMemo(() => ({
    roles: roles.length,
    entitlements: new Set(roles.flatMap(item => item.entitlements)).size,
    highRisk: roles.filter(item => item.entitlements.some(id => ENTITLEMENTS.find(e => e.id === id)?.risk === "High")).length,
  }), [roles]);

  function toggleEntitlement(id: string) {
    setRoles(current => current.map(item => item.id !== selectedRole ? item : {
      ...item, entitlements: item.entitlements.includes(id) ? item.entitlements.filter(value => value !== id) : [...item.entitlements, id],
    }));
    setMessage("Role entitlement mapping updated in this local exercise. Review impact before considering a real change.");
  }

  function createRole() {
    const name = draftName.trim();
    if (!name) { setMessage("Enter a role name before creating the role."); return; }
    const id = "custom-" + name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + (roles.length + 1);
    setRoles(current => [...current, { id, name, kind: draftKind, description: draftDescription.trim() || "Learner-created practice role.", entitlements: [] }]);
    setSelectedRole(id);
    setDraftName("");
    setDraftDescription("");
    setShowBuilder(false);
    setMessage("Practice role created locally. Add only the entitlements justified by its business purpose.");
  }

  return <div className="space-y-6">
    <PageHeader title="RBAC & Role Engineering Simulator" subtitle="Design business and IT roles, map entitlements, inspect user access and practise basic SoD risk checks." />

    <div className="grid gap-3 sm:grid-cols-3">
      <Metric icon={<Layers3 className="h-5 w-5 text-primary"/>} label="Practice roles" value={metrics.roles}/>
      <Metric icon={<GitBranch className="h-5 w-5 text-primary"/>} label="Mapped entitlements" value={metrics.entitlements}/>
      <Metric icon={<ShieldCheck className="h-5 w-5 text-primary"/>} label="Roles containing high-risk access" value={metrics.highRisk}/>
    </div>

    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center gap-2"><CircleAlert className="h-5 w-5 text-primary"/><h2 className="font-semibold">RBAC design principle</h2></div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">A business role represents a job function or business responsibility; an IT role groups technical access, often across one or more applications. Roles should be based on least privilege, clear ownership, consistent naming, approval and periodic review. A role is not automatically safe simply because it is assigned by job title.</p>
    </section>

    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <section className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">Role catalogue</h2><button type="button" onClick={()=>setShowBuilder(v=>!v)} className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">{showBuilder?"Close":"Create practice role"}</button></div>
        {showBuilder&&<div className="space-y-3 rounded-xl border bg-muted/30 p-3">
          <label className="block text-xs font-medium">Role name<input value={draftName} onChange={e=>setDraftName(e.target.value)} placeholder="e.g. Procurement Analyst" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"/></label>
          <label className="block text-xs font-medium">Role type<select value={draftKind} onChange={e=>setDraftKind(e.target.value as "Business"|"IT")} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"><option>Business</option><option>IT</option></select></label>
          <label className="block text-xs font-medium">Business purpose<input value={draftDescription} onChange={e=>setDraftDescription(e.target.value)} placeholder="Describe why this role exists" className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm"/></label>
          <button type="button" onClick={createRole} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Create role</button>
        </div>}
        <div className="space-y-2">{roles.map(item=><button type="button" key={item.id} onClick={()=>{setSelectedRole(item.id);setMessage("");}} className={"w-full rounded-xl border p-3 text-left "+(selectedRole===item.id?"border-primary bg-primary/5":"hover:bg-muted")}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{item.name}</span><Badge variant="outline">{item.kind} role</Badge></div><p className="mt-1 text-xs text-muted-foreground">{item.description}</p><p className="mt-2 text-xs text-muted-foreground">{item.entitlements.length} mapped entitlements</p></button>)}</div>
      </section>

      <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
        <div><h2 className="font-semibold">Entitlement mapping</h2><p className="mt-1 text-xs text-muted-foreground">Selected role: <strong>{role.name}</strong> · {role.kind}</p></div>
        <div className="space-y-2">{ENTITLEMENTS.map(item=><label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 hover:bg-muted/50"><input type="checkbox" checked={role.entitlements.includes(item.id)} onChange={()=>toggleEntitlement(item.id)} className="mt-1 h-4 w-4 accent-primary"/><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-sm font-medium">{item.name}<Badge variant={item.risk==="High"?"destructive":"outline"}>{item.risk} risk</Badge></span><span className="mt-1 block text-xs text-muted-foreground">{item.app} · {item.function}</span></span></label>)}</div>
        {message&&<p role="status" className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{message}</p>}
      </section>
    </div>

    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary"/><h2 className="font-semibold">User-to-role assignment and effective access</h2></div>
      <p className="mt-1 text-sm text-muted-foreground">Choose a fictional identity to see how assigned roles expand into application entitlements.</p>
      <label className="mt-4 block max-w-md text-xs font-medium text-muted-foreground">Select identity<select value={selectedPerson} onChange={e=>setSelectedPerson(e.target.value)} className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground">{PEOPLE.map(item=><option key={item.id} value={item.id}>{item.name} — {item.title}</option>)}</select></label>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-muted/40 p-4"><p className="text-xs text-muted-foreground">Identity profile</p><p className="mt-1 font-semibold">{person.name}</p><p className="text-sm text-muted-foreground">{person.department} · {person.title}</p><p className="mt-3 text-xs text-muted-foreground">Assigned roles</p><div className="mt-2 flex flex-wrap gap-2">{assignedRoles.map(item=><Badge key={item.id} variant="outline">{item.name}</Badge>)}</div></div>
        <div className="rounded-xl bg-muted/40 p-4"><p className="text-xs text-muted-foreground">Effective entitlements</p><p className="mt-1 text-2xl font-semibold">{assignedEntitlements.length}</p><div className="mt-2 flex flex-wrap gap-2">{assignedEntitlements.map(item=><Badge key={item.id} variant="outline">{item.name}</Badge>)}</div></div>
      </div>
      <div className={"mt-4 rounded-xl border p-4 "+(hasSodConflict?"border-destructive/40 bg-destructive/5":"border-emerald-500/30 bg-emerald-500/5")}>
        <div className="flex items-center gap-2 font-semibold">{hasSodConflict?<CircleAlert className="h-4 w-4 text-destructive"/>:<CheckCircle2 className="h-4 w-4 text-emerald-600"/>}{hasSodConflict?"Potential SoD conflict detected":"No configured sample SoD conflict detected"}</div>
        <p className="mt-1 text-sm text-muted-foreground">{hasSodConflict?"This identity has both Vendor Master Creator and Payment Approver in the effective access set. In a real environment, validate the conflict against approved SoD rules and mitigating controls.":"The sample conflict checks whether the same identity can create a vendor and approve supplier payments. This limited check is illustrative, not a full SoD engine."}</p>
      </div>
    </section>

    <section className="rounded-2xl border bg-card p-4 sm:p-5"><h2 className="font-semibold">Role engineering workflow</h2><ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{t:"1. Discover",d:"Analyse job functions, existing access and common entitlement patterns."},{t:"2. Design",d:"Define role purpose, owner, eligibility and least-privilege scope."},{t:"3. Map",d:"Associate application entitlements and document access rationale."},{t:"4. Govern",d:"Review SoD, approvals, certification, exceptions and role changes."}].map(item=><li key={item.t} className="rounded-xl bg-muted/40 p-3"><p className="text-sm font-semibold">{item.t}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.d}</p></li>)}</ol></section>

    <p className="text-xs text-muted-foreground">Training-only simulator with fictional identities and entitlements. Role creation and mappings are held in page state only. No Saviynt tenant, real access, production data or provisioning endpoint is connected. The SoD check covers one explicitly defined sample conflict and is not a substitute for a configured Saviynt risk ruleset.</p>
  </div>;
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2">{icon}<span className="text-xs text-muted-foreground">{label}</span></div><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}

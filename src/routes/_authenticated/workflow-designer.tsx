import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDown, ArrowRight, CheckCircle2, ClipboardList, GitBranch, Plus, RotateCcw, ShieldCheck, Workflow, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/workflow-designer")({ component: WorkflowDesigner });

type Trigger = "access-request" | "hire" | "mover" | "termination";
type Approval = "manager" | "app-owner" | "data-owner" | "security";
type Fulfillment = "automatic" | "manual" | "ticket";
type Step = { id: number; type: "approval"; approver: Approval };

const TRIGGERS: { value: Trigger; label: string; description: string }[] = [
  { value: "access-request", label: "Access request submitted", description: "A user requests an application or entitlement" },
  { value: "hire", label: "Joiner event", description: "A new worker becomes eligible for identity creation and birthright access" },
  { value: "mover", label: "Mover event", description: "A department, location or job assignment changes" },
  { value: "termination", label: "Leaver event", description: "A worker reaches a termination or end-date event" },
];
const APPROVERS: { value: Approval; label: string; note: string }[] = [
  { value: "manager", label: "Manager", note: "Validates business need" },
  { value: "app-owner", label: "Application owner", note: "Confirms application-level access" },
  { value: "data-owner", label: "Data owner", note: "Approves access to governed data" },
  { value: "security", label: "Security / risk owner", note: "Reviews elevated or policy-sensitive access" },
];

function WorkflowDesigner() {
  const [trigger, setTrigger] = useState<Trigger>("access-request");
  const [approvals, setApprovals] = useState<Step[]>([{ id: 1, type: "approval", approver: "manager" }, { id: 2, type: "approval", approver: "app-owner" }]);
  const [riskCheck, setRiskCheck] = useState(true);
  const [sodCheck, setSodCheck] = useState(true);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("automatic");
  const [notify, setNotify] = useState(true);
  const [showBlueprint, setShowBlueprint] = useState(false);
  const [nextId, setNextId] = useState(3);

  const triggerInfo = TRIGGERS.find(item => item.value === trigger)!;
  const approvalLabels = approvals.map(step => APPROVERS.find(item => item.value === step.approver)?.label ?? step.approver);
  const validation = useMemo(() => {
    const warnings: string[] = [];
    if (trigger === "termination" && fulfillment === "automatic") warnings.push("For leaver workflows, validate disable/deprovision sequencing, exception handling and emergency access before enabling automated fulfillment.");
    if (trigger === "termination" && approvals.length > 0) warnings.push("Avoid unnecessary approval gates that delay urgent leaver controls. Confirm policy and timing with HR and security owners.");
    if (trigger === "access-request" && approvals.length === 0) warnings.push("No human approval step is configured. Confirm that the requested access is eligible for policy-based or automatic approval.");
    if (!riskCheck) warnings.push("Risk evaluation is disabled. Confirm whether risk-based routing or elevated-access controls are required.");
    if (!sodCheck && trigger === "access-request") warnings.push("SoD evaluation is disabled. Confirm whether the requested entitlement can create a segregation-of-duties conflict.");
    return warnings;
  }, [trigger, fulfillment, approvals.length, riskCheck, sodCheck]);

  function addApproval() {
    if (approvals.length >= 4) return;
    const used = new Set(approvals.map(step => step.approver));
    const next = APPROVERS.find(item => !used.has(item.value));
    if (!next) return;
    setApprovals(previous => [...previous, { id: nextId, type: "approval", approver: next.value }]);
    setNextId(value => value + 1);
  }
  function updateApproval(id: number, approver: Approval) {
    setApprovals(previous => previous.map(step => step.id === id ? { ...step, approver } : step));
  }
  function removeApproval(id: number) {
    setApprovals(previous => previous.filter(step => step.id !== id));
  }
  function reset() {
    setTrigger("access-request");
    setApprovals([{ id: 1, type: "approval", approver: "manager" }, { id: 2, type: "approval", approver: "app-owner" }]);
    setRiskCheck(true); setSodCheck(true); setFulfillment("automatic"); setNotify(true); setShowBlueprint(false); setNextId(3);
  }

  const blueprint = [
    "WORKFLOW DESIGN BLUEPRINT — LEARNING SIMULATION",
    "Trigger: " + triggerInfo.label,
    "1. Validate identity, requester, target application and requested access.",
    ...(riskCheck ? ["2. Evaluate access risk and route elevated access for additional review."] : ["2. Risk evaluation: not configured."]),
    ...(sodCheck ? ["3. Evaluate applicable SoD policies and block or route conflicts according to policy."] : ["3. SoD evaluation: not configured."]),
    ...(approvalLabels.length ? approvalLabels.map((label, index) => (index + 4) + ". Approval: " + label + ".") : ["4. No human approval step configured."]),
    (approvalLabels.length + 4) + ". Fulfillment: " + ({ automatic: "automated connector provisioning", manual: "manual fulfillment by authorized operator", ticket: "service-ticket handoff" }[fulfillment]) + ".",
    (approvalLabels.length + 5) + ". Verify target outcome, record audit evidence and handle failures/retries.",
    ...(notify ? [(approvalLabels.length + 6) + ". Notify requester and relevant stakeholders of the final outcome."] : []),
    "",
    "IMPORTANT: Conceptual design only. This is not Saviynt-importable workflow JSON or a production configuration."
  ].join("\n");

  async function copyBlueprint() {
    try { await navigator.clipboard.writeText(blueprint); } catch { /* Clipboard may be unavailable in embedded preview. */ }
  }

  const selectClass = "w-full rounded-lg border bg-background px-3 py-2 text-sm";

  return <div className="space-y-6">
    <PageHeader title="Workflow Design Simulator" subtitle="Build a conceptual IGA workflow by selecting lifecycle triggers, policy checks, approval steps and fulfillment paths." action={<Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4"/>Reset design</Button>} />
    <section className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2"><Workflow className="h-5 w-5 text-primary"/><h2 className="font-semibold">1. Select workflow trigger</h2></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {TRIGGERS.map(item=><button key={item.value} type="button" onClick={()=>{setTrigger(item.value);setShowBlueprint(false);}} aria-pressed={trigger===item.value} className={"rounded-xl border p-4 text-left transition "+(trigger===item.value?"border-primary bg-primary/5 ring-1 ring-primary/20":"hover:bg-muted")}><span className="block text-sm font-semibold">{item.label}</span><span className="mt-1 block text-xs text-muted-foreground">{item.description}</span></button>)}
      </div>
    </section>

    <section className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary"/><h2 className="font-semibold">2. Configure governance checks</h2></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={riskCheck} onChange={event=>{setRiskCheck(event.target.checked);setShowBlueprint(false);}}/><span><span className="block text-sm font-semibold">Risk evaluation</span><span className="mt-1 block text-xs text-muted-foreground">Identify elevated or sensitive access and route for additional review.</span></span></label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4"><input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={sodCheck} onChange={event=>{setSodCheck(event.target.checked);setShowBlueprint(false);}}/><span><span className="block text-sm font-semibold">Segregation of Duties (SoD)</span><span className="mt-1 block text-xs text-muted-foreground">Evaluate policy conflicts before access is fulfilled.</span></span></label>
      </div>
    </section>

    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><GitBranch className="h-5 w-5 text-primary"/><h2 className="font-semibold">3. Build approval chain</h2></div><Button variant="outline" size="sm" onClick={addApproval} disabled={approvals.length>=4}><Plus className="mr-1 h-4 w-4"/>Add approver</Button></div>
      <p className="mt-1 text-xs text-muted-foreground">Approval steps are evaluated in the order shown. Configure only accountable approvers required by policy.</p>
      <div className="mt-4 space-y-2">
        {approvals.map((step,index)=><div key={step.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-3"><Badge variant="outline">Step {index+1}</Badge><select aria-label={"Approver for step "+(index+1)} className={selectClass+" min-w-0 flex-1"} value={step.approver} onChange={event=>{updateApproval(step.id,event.target.value as Approval);setShowBlueprint(false);}}>{APPROVERS.map(item=><option key={item.value} value={item.value}>{item.label} — {item.note}</option>)}</select><Button variant="ghost" size="icon" aria-label="Remove approval step" onClick={()=>{removeApproval(step.id);setShowBlueprint(false);}}><X className="h-4 w-4"/></Button></div>)}
        {approvals.length===0&&<p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No human approval steps. Use this only when an approved policy explicitly permits automated or policy-based approval.</p>}
      </div>
      {approvals.length<4&&<p className="mt-2 text-xs text-muted-foreground">{4-approvals.length} additional approver slot(s) available.</p>}
    </section>

    <section className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2"><ArrowRight className="h-5 w-5 text-primary"/><h2 className="font-semibold">4. Configure fulfillment and notifications</h2></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">Fulfillment method<select className={selectClass} value={fulfillment} onChange={event=>{setFulfillment(event.target.value as Fulfillment);setShowBlueprint(false);}}><option value="automatic">Automated connector provisioning</option><option value="manual">Manual fulfillment</option><option value="ticket">Service-ticket handoff</option></select></label>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-primary" checked={notify} onChange={event=>{setNotify(event.target.checked);setShowBlueprint(false);}}/>Notify requester and stakeholders</label>
      </div>
    </section>

    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-semibold">5. Workflow preview</h2><p className="mt-1 text-xs text-muted-foreground">A simplified logical view of your current design.</p></div><Button onClick={()=>setShowBlueprint(true)}><ClipboardList className="mr-2 h-4 w-4"/>Generate blueprint</Button></div>
      <div className="mx-auto mt-5 max-w-xl space-y-2">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-center"><Badge>Trigger</Badge><p className="mt-1 text-sm font-semibold">{triggerInfo.label}</p></div>
        <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground"/>
        <div className="rounded-xl border p-3 text-center"><p className="text-sm font-semibold">Identity and request validation</p><p className="text-xs text-muted-foreground">Validate requester, identity, application and access object</p></div>
        <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground"/>
        {riskCheck&&<><div className="rounded-xl border p-3 text-center"><p className="text-sm font-semibold">Risk evaluation</p><p className="text-xs text-muted-foreground">Evaluate risk and elevated access rules</p></div><ArrowDown className="mx-auto h-4 w-4 text-muted-foreground"/></>}
        {sodCheck&&<><div className="rounded-xl border p-3 text-center"><p className="text-sm font-semibold">SoD policy evaluation</p><p className="text-xs text-muted-foreground">Detect conflicts and route exceptions according to policy</p></div><ArrowDown className="mx-auto h-4 w-4 text-muted-foreground"/></>}
        {approvals.map((step,index)=><div key={step.id} className="space-y-2"><div className="rounded-xl border p-3 text-center"><Badge variant="outline">Approval {index+1}</Badge><p className="mt-1 text-sm font-semibold">{APPROVERS.find(item=>item.value===step.approver)?.label}</p></div><ArrowDown className="mx-auto h-4 w-4 text-muted-foreground"/></div>)}
        <div className="rounded-xl border p-3 text-center"><p className="text-sm font-semibold">Fulfillment</p><p className="text-xs text-muted-foreground">{{automatic:"Connector provisioning",manual:"Manual operator task",ticket:"Service-ticket handoff"}[fulfillment]}</p></div>
        <ArrowDown className="mx-auto h-4 w-4 text-muted-foreground"/>
        <div className="rounded-xl border p-3 text-center"><p className="text-sm font-semibold">Verify outcome and audit</p><p className="text-xs text-muted-foreground">Confirm target result, capture evidence and handle exceptions</p></div>
        {notify&&<><ArrowDown className="mx-auto h-4 w-4 text-muted-foreground"/><div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-center"><p className="text-sm font-semibold">Notifications</p><p className="text-xs text-muted-foreground">Send final status to requester and stakeholders</p></div></>}
      </div>
      {validation.length>0&&<div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><p className="flex items-center gap-2 text-sm font-semibold"><ClipboardList className="h-4 w-4"/>Design review notes</p><ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">{validation.map(note=><li key={note}>{note}</li>)}</ul></div>}
      {showBlueprint&&<div className="mt-5 rounded-xl border bg-muted/40 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Generated design blueprint</h3><Button variant="outline" size="sm" onClick={copyBlueprint}>Copy blueprint</Button></div><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-xs leading-5">{blueprint}</pre></div>}
    </section>
    <p className="text-xs text-muted-foreground">This is a conceptual learning tool, not a Saviynt workflow configuration generator. It does not produce importable Saviynt JSON, call APIs, provision access, create tickets or change live policies. Actual workflow capabilities and syntax must be verified against your Saviynt tenant and product documentation.</p>
  </div>;
}

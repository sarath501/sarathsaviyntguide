import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ClipboardCheck, RotateCcw, ShieldAlert, XCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/access-review")({ component: AccessReviewSimulator });

type Decision = "keep" | "revoke" | "escalate";
type Scenario = { id: number; user: string; role: string; application: string; entitlement: string; context: string; risk: string; expected: Decision; rationale: string };
const CASES: Scenario[] = [
  { id: 1, user: "A. Kumar", role: "Finance Analyst", application: "ERP Finance", entitlement: "Invoice Viewer", context: "The user is active in Finance. The manager confirms this access is required for daily invoice checks.", risk: "Low", expected: "keep", rationale: "The entitlement aligns with the user's current job duties and has been confirmed by the responsible manager. Retain it and document the review evidence." },
  { id: 2, user: "B. Rao", role: "Procurement Specialist", application: "ERP Finance", entitlement: "Supplier Create + Payment Approve", context: "The user holds both entitlements. The organization's SoD policy defines supplier creation and payment approval as incompatible.", risk: "High", expected: "revoke", rationale: "This is a defined SoD conflict. Revoke the inappropriate entitlement according to policy, or follow the formal exception and mitigation process if immediate removal is not possible." },
  { id: 3, user: "C. Shah", role: "Sales Manager", application: "CRM", entitlement: "Regional Sales Admin", context: "The manager has not responded. The entitlement grants broad access to customer records and administration functions.", risk: "High", expected: "escalate", rationale: "Do not assume approval from silence. Follow the certification escalation policy, notify the appropriate owner, and apply the organization's overdue-review controls." },
  { id: 4, user: "D. Iyer", role: "Former Contractor", application: "Corporate Directory", entitlement: "VPN-Standard", context: "The authoritative worker feed shows the contract ended 12 days ago. The account is still enabled.", risk: "High", expected: "revoke", rationale: "The identity is no longer eligible for access. Initiate the approved leaver remediation and verify that the account and related access are disabled or removed." },
  { id: 5, user: "E. Das", role: "HR Business Partner", application: "HR Platform", entitlement: "Employee Records - Read", context: "The user is active in HR. The application owner confirms this read-only entitlement is required for the assigned region.", risk: "Low", expected: "keep", rationale: "The entitlement is justified by current responsibilities and has been confirmed by the accountable owner. Retain it with the review evidence." },
  { id: 6, user: "F. Nair", role: "Application Support", application: "Production Database", entitlement: "DBA Full Control", context: "The user says the access was needed for a one-time incident six months ago. No current ticket, approval, or support duty justifies it.", risk: "High", expected: "revoke", rationale: "The original temporary need has ended and there is no current business justification. Remove the excessive privilege through the approved process." },
  { id: 7, user: "G. Menon", role: "Department Lead", application: "Document Management", entitlement: "Confidential Project Folder", context: "The reviewer cannot determine whether the user is still assigned to the project. The project owner is available but has not yet been consulted.", risk: "Medium", expected: "escalate", rationale: "The reviewer lacks sufficient context. Obtain confirmation from the project or data owner before making a final decision; do not retain access by default." },
  { id: 8, user: "H. Reddy", role: "IT Operations", application: "Cloud Console", entitlement: "Global Administrator", context: "The user is an active platform engineer, but the approved access model specifies time-bound privileged access. The current assignment has no expiry date.", risk: "High", expected: "escalate", rationale: "The role may require privileged access, but the permanent assignment conflicts with the time-bound control. Escalate for owner validation and correction to the approved privileged-access model." },
];

const DECISIONS: { value: Decision; label: string }[] = [
  { value: "keep", label: "Keep access" },
  { value: "revoke", label: "Revoke access" },
  { value: "escalate", label: "Escalate for review" },
];

function AccessReviewSimulator() {
  const [answers, setAnswers] = useState<Record<number, Decision>>({});
  const [submitted, setSubmitted] = useState(false);
  const score = useMemo(() => CASES.filter(c => answers[c.id] === c.expected).length, [answers]);
  const complete = CASES.every(c => answers[c.id]);
  const answered = Object.keys(answers).length;

  function reset() { setAnswers({}); setSubmitted(false); }

  return <div className="space-y-6">
    <PageHeader title="Access Review Simulator" subtitle="Practice certification decisions using realistic identity governance scenarios. This is a learning simulation, not a live access review." action={<Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4"/>Reset practice</Button>} />
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Scenarios</p><p className="mt-1 text-2xl font-semibold">8</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Decisions made</p><p className="mt-1 text-2xl font-semibold">{answered}/8</p></div>
      <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{submitted ? "Your score" : "Progress"}</p><p className="mt-1 text-2xl font-semibold">{submitted ? `${score}/8` : `${Math.round(answered/8*100)}%`}</p></div>
    </div>
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-center gap-2 font-semibold"><ClipboardCheck className="h-5 w-5 text-primary"/>Reviewer decision guide</div>
      <p className="mt-2 text-sm text-muted-foreground">Use current job responsibilities, manager or application-owner evidence, SoD policy, identity lifecycle status and least-privilege requirements. Escalate when evidence is insufficient; do not treat a missing response as approval.</p>
    </div>
    {submitted && <div className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Practice results</h2><p className="text-sm text-muted-foreground">You matched the recommended decision in {score} of 8 scenarios.</p></div><Badge variant={score >= 6 ? "default" : "secondary"}>{score >= 6 ? "Strong review judgement" : "Review the explanations"}</Badge></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${score/8*100}%`}}/></div></div>}
    <div className="space-y-4">
      {CASES.map((c,index)=>{
        const choice=answers[c.id];
        const correct=choice===c.expected;
        return <article key={c.id} className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge variant="outline">Scenario {index+1}</Badge><Badge variant={c.risk==="High"?"destructive":"secondary"}>{c.risk} risk</Badge></div>{submitted&&(correct?<span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4"/>Correct</span>:<span className="flex items-center gap-1 text-sm text-destructive"><XCircle className="h-4 w-4"/>Review decision</span>)}</div>
          <h2 className="mt-3 text-lg font-semibold">{c.user} · {c.role}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{c.application} / {c.entitlement}</p>
          <p className="mt-3 text-sm leading-6">{c.context}</p>
          <fieldset className="mt-4"><legend className="mb-2 text-sm font-semibold">Your certification decision</legend><div className="grid gap-2 sm:grid-cols-3">{DECISIONS.map(d=><button key={d.value} type="button" disabled={submitted} onClick={()=>setAnswers(prev=>({...prev,[c.id]:d.value}))} aria-pressed={choice===d.value} className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${choice===d.value?"border-primary bg-primary/10 text-primary":"bg-background hover:bg-muted"} disabled:cursor-default`}>{d.label}</button>)}</div></fieldset>
          {submitted&&<div className="mt-4 rounded-lg bg-muted/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommended decision: {DECISIONS.find(d=>d.value===c.expected)?.label}</p><p className="mt-2 text-sm leading-6">{c.rationale}</p></div>}
        </article>;
      })}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{submitted?"Review the explanations above, then reset to practise again.":`${answered} of 8 decisions selected. Complete all scenarios to view your results.`}</p><Button onClick={()=>setSubmitted(true)} disabled={!complete||submitted}><ShieldAlert className="mr-2 h-4 w-4"/>Submit decisions</Button></div>
    <p className="text-xs text-muted-foreground">All scenarios and scoring are illustrative and run locally in your browser. No real identities, entitlements, certification campaigns, or access changes are involved. Actual review decisions must follow your organization's policy, evidence requirements and approved remediation process.</p>
  </div>;
}

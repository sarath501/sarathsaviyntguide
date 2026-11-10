import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Mail, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/email-templates")({ component: EmailTemplateCenter });

type EmailTemplate = {
  id: string; title: string; category: string; purpose: string; trigger: string;
  subject: string; body: string; variables: string[]; notes: string[];
};

const TEMPLATES: EmailTemplate[] = [
  {
    id: "request-submitted", title: "Access Request Submitted", category: "Access Requests",
    purpose: "Confirms that an access request has been submitted and is awaiting processing.",
    trigger: "After a user submits an access request successfully.",
    subject: "Access request submitted – {{requestId}}",
    body: "Hello {{requesterName}},\n\nYour access request has been submitted successfully.\n\nRequest ID: {{requestId}}\nApplication: {{applicationName}}\nRequested access: {{accessName}}\nSubmitted on: {{submittedDate}}\nCurrent status: {{requestStatus}}\n\nYou can review the request status in the identity portal.\n\nRegards,\nIdentity Governance Team",
    variables: ["requesterName", "requestId", "applicationName", "accessName", "submittedDate", "requestStatus"],
    notes: ["Use the request identifier as a traceable reference.", "Do not state that access has been granted at submission time."]
  },
  {
    id: "approval-pending", title: "Approval Required", category: "Approvals",
    purpose: "Notifies an approver that an access request requires a decision.",
    trigger: "When a workflow task is assigned to an approver.",
    subject: "Action required: Access approval – {{requestId}}",
    body: "Hello {{approverName}},\n\nAn access request is waiting for your review.\n\nRequester: {{requesterName}}\nApplication: {{applicationName}}\nRequested access: {{accessName}}\nBusiness justification: {{businessJustification}}\nRequest ID: {{requestId}}\nDue date: {{dueDate}}\n\nPlease review the request and approve or reject it using the approved identity portal.\n\nRegards,\nIdentity Governance Team",
    variables: ["approverName", "requesterName", "applicationName", "accessName", "businessJustification", "requestId", "dueDate"],
    notes: ["Include enough context for an informed decision.", "Link to the authenticated approval task; never ask users to send passwords by email."]
  },
  {
    id: "approved", title: "Access Request Approved", category: "Access Requests",
    purpose: "Confirms approval, while clearly distinguishing approval from completed provisioning.",
    trigger: "After the required approval steps have completed successfully.",
    subject: "Access request approved – {{requestId}}",
    body: "Hello {{requesterName}},\n\nYour access request has been approved. Provisioning may still be in progress.\n\nRequest ID: {{requestId}}\nApplication: {{applicationName}}\nAccess: {{accessName}}\nApproval completed: {{approvalDate}}\nCurrent fulfilment status: {{fulfilmentStatus}}\n\nYou will receive a further update when fulfilment is completed or requires attention.\n\nRegards,\nIdentity Governance Team",
    variables: ["requesterName", "requestId", "applicationName", "accessName", "approvalDate", "fulfilmentStatus"],
    notes: ["Do not describe approval as successful provisioning.", "Use a separate completion notification if the connector task finishes later."]
  },
  {
    id: "rejected", title: "Access Request Rejected", category: "Access Requests",
    purpose: "Communicates a rejection with a concise reason and a support route.",
    trigger: "When an authorized approver rejects the request.",
    subject: "Access request update – {{requestId}}",
    body: "Hello {{requesterName}},\n\nYour access request was not approved.\n\nRequest ID: {{requestId}}\nApplication: {{applicationName}}\nRequested access: {{accessName}}\nDecision date: {{decisionDate}}\nDecision comments: {{decisionComments}}\n\nIf you believe this decision needs clarification, contact the application owner or service desk through the approved support channel.\n\nRegards,\nIdentity Governance Team",
    variables: ["requesterName", "requestId", "applicationName", "accessName", "decisionDate", "decisionComments"],
    notes: ["Avoid exposing sensitive reviewer notes or internal risk details.", "Ensure comments are appropriate for the requester."]
  },
  {
    id: "provisioned", title: "Access Provisioning Completed", category: "Provisioning",
    purpose: "Confirms that the target-system provisioning task completed successfully.",
    trigger: "After the target connector task reports successful fulfilment and reconciliation checks pass.",
    subject: "Access is ready – {{applicationName}}",
    body: "Hello {{requesterName}},\n\nThe requested access has been provisioned successfully.\n\nApplication: {{applicationName}}\nAccess: {{accessName}}\nCompleted on: {{completedDate}}\nRequest ID: {{requestId}}\n\nPlease follow your organization's security requirements when using this access.\n\nRegards,\nIdentity Governance Team",
    variables: ["requesterName", "applicationName", "accessName", "completedDate", "requestId"],
    notes: ["Only send after confirmed target-side success.", "If aggregation/reconciliation is required, include it in the completion criteria."]
  },
  {
    id: "provision-failed", title: "Provisioning Failed / Requires Attention", category: "Provisioning",
    purpose: "Informs the support team or requester that fulfilment did not complete.",
    trigger: "When a provisioning task enters a configured failed or manual-intervention state.",
    subject: "Action required: Provisioning issue – {{requestId}}",
    body: "Hello {{recipientName}},\n\nThe access fulfilment task requires attention.\n\nRequest ID: {{requestId}}\nApplication: {{applicationName}}\nTask reference: {{taskId}}\nCurrent status: {{taskStatus}}\nFailure summary: {{failureSummary}}\n\nPlease review the task in the approved support console and follow the operational runbook.\n\nRegards,\nIGA Operations",
    variables: ["recipientName", "requestId", "applicationName", "taskId", "taskStatus", "failureSummary"],
    notes: ["Do not include passwords, tokens, connection strings or full stack traces.", "Send detailed diagnostics only to authorized support recipients."]
  },
  {
    id: "certification-launch", title: "Access Certification Assigned", category: "Certifications",
    purpose: "Notifies a reviewer that a certification campaign or review item is assigned.",
    trigger: "When a certification campaign launches or review work is assigned.",
    subject: "Access review assigned – {{campaignName}}",
    body: "Hello {{reviewerName}},\n\nYou have been assigned access review items in the following campaign.\n\nCampaign: {{campaignName}}\nReview scope: {{reviewScope}}\nItems assigned: {{itemCount}}\nDue date: {{dueDate}}\n\nPlease review each item and record a decision with an appropriate rationale before the deadline.\n\nRegards,\nIdentity Governance Team",
    variables: ["reviewerName", "campaignName", "reviewScope", "itemCount", "dueDate"],
    notes: ["Provide a secure link to the campaign in the real notification.", "Ensure the recipient is the correct reviewer or delegate."]
  },
  {
    id: "certification-reminder", title: "Certification Reminder / Escalation", category: "Certifications",
    purpose: "Reminds reviewers about outstanding certification decisions or escalates overdue work.",
    trigger: "A configured reminder or escalation schedule identifies pending or overdue review items.",
    subject: "Reminder: Access review due {{dueDate}}",
    body: "Hello {{reviewerName}},\n\nThis is a reminder that access review actions are still pending.\n\nCampaign: {{campaignName}}\nPending items: {{pendingCount}}\nDue date: {{dueDate}}\nDays overdue: {{daysOverdue}}\n\nPlease complete the outstanding decisions. If you are unable to complete the review, follow the configured delegation or escalation process.\n\nRegards,\nIdentity Governance Team",
    variables: ["reviewerName", "campaignName", "pendingCount", "dueDate", "daysOverdue"],
    notes: ["Configure reminder frequency and escalation recipients carefully.", "Avoid repeated notifications after a campaign is completed."]
  },
  {
    id: "password-reset", title: "Password Reset / Change Notification", category: "Account & Security",
    purpose: "Provides a security notification about a password-related event without disclosing the credential.",
    trigger: "After a password reset or change event, according to the organization's notification policy.",
    subject: "Password activity notification",
    body: "Hello {{userName}},\n\nA password-related action was recorded for your account on {{eventDateTime}}.\n\nAccount: {{accountName}}\nApplication: {{applicationName}}\nAction: {{passwordAction}}\n\nIf you did not initiate or expect this activity, contact the service desk immediately using your organization's verified support channel.\n\nFor your security, this email will never contain your password or one-time secret.\n\nRegards,\nSecurity Operations",
    variables: ["userName", "eventDateTime", "accountName", "applicationName", "passwordAction"],
    notes: ["Never include a password, OTP, reset token or secret in email.", "Use verified links and approved identity-verification procedures."]
  },
  {
    id: "account-created", title: "Account Created / Updated", category: "Account & Security",
    purpose: "Notifies an authorized recipient that an account lifecycle task completed.",
    trigger: "After account create or update provisioning completes and is verified.",
    subject: "Account update completed – {{applicationName}}",
    body: "Hello {{recipientName}},\n\nAn account lifecycle task has completed.\n\nIdentity: {{identityName}}\nAccount: {{accountName}}\nApplication: {{applicationName}}\nAction: {{accountAction}}\nCompleted: {{completedDate}}\nTask reference: {{taskId}}\n\nRegards,\nIGA Operations",
    variables: ["recipientName", "identityName", "accountName", "applicationName", "accountAction", "completedDate", "taskId"],
    notes: ["Send only to recipients with a business need to know.", "Avoid exposing unnecessary personal or account attributes."]
  },
  {
    id: "generic-workflow", title: "Workflow Task Notification", category: "Workflow & Operations",
    purpose: "Provides a generic notification when a workflow task requires an action.",
    trigger: "When a configured workflow step is assigned or becomes actionable.",
    subject: "Workflow action required – {{workflowName}}",
    body: "Hello {{assigneeName}},\n\nA workflow task requires your attention.\n\nWorkflow: {{workflowName}}\nTask: {{taskName}}\nRelated identity: {{identityName}}\nDue date: {{dueDate}}\nReference: {{taskId}}\n\nPlease open the task in the approved portal to review and complete the required action.\n\nRegards,\nIGA Operations",
    variables: ["assigneeName", "workflowName", "taskName", "identityName", "dueDate", "taskId"],
    notes: ["Use actionable subjects and clear due dates.", "Ensure reassignment and delegation rules are reflected in recipients."]
  }
];

const CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map(item => item.category)))];

function EmailTemplateCenter() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(TEMPLATES[0].id);
  const [copied, setCopied] = useState("");
  const [sampleValues, setSampleValues] = useState<Record<string,string>>({});
  const selected = TEMPLATES.find(item => item.id === selectedId) ?? TEMPLATES[0];

  const filtered = useMemo(() => TEMPLATES.filter(item =>
    (category === "All" || item.category === category) &&
    (query.trim().length === 0 || (item.title + " " + item.purpose + " " + item.trigger + " " + item.category).toLowerCase().includes(query.toLowerCase()))
  ), [query, category]);

  function render(text: string) {
    return text.replace(/\{\{(.*?)\}\}/g, (_, key: string) => sampleValues[key] || `[${key}]`);
  }
  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setCopied("Copy unavailable — select the text manually");
    }
  }
  const fullText = `Subject: ${selected.subject}\n\n${selected.body}`;

  return <div className="space-y-6">
    <PageHeader title="Saviynt Email Template Center" subtitle="Explore common IGA notification scenarios, understand triggers and variables, and prepare reusable email drafts." />
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
      <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-primary"/><h2 className="font-semibold">Email notification lifecycle</h2></div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">A typical notification flow is: event or scheduled job → workflow / campaign / task state → recipient resolution → email template and variable substitution → mail server delivery → delivery monitoring. Exact event hooks, template fields and supported variables depend on the Saviynt EIC release and tenant configuration.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="Ready-to-adapt templates" value={TEMPLATES.length}/>
      <Metric label="Notification categories" value={CATEGORIES.length-1}/>
      <Metric label="Template variables" value={new Set(TEMPLATES.flatMap(item=>item.variables)).size}/>
    </div>
    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search approval, certification, password, provisioning..." className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"/></div>
        <div className="flex flex-wrap gap-2">{CATEGORIES.map(item=><button key={item} type="button" onClick={()=>setCategory(item)} className={"rounded-lg border px-3 py-2 text-xs font-medium "+(category===item?"border-primary bg-primary/10 text-primary":"hover:bg-muted")}>{item}</button>)}</div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{filtered.length} templates available</p>
    </section>
    <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
      <aside className="space-y-2">{filtered.map(item=><button key={item.id} type="button" onClick={()=>{setSelectedId(item.id);setCopied("");}} className={"w-full rounded-xl border p-3 text-left "+(selectedId===item.id?"border-primary bg-primary/5":"bg-card hover:bg-muted")}><span className="block text-sm font-semibold">{item.title}</span><span className="mt-1 block text-xs text-muted-foreground">{item.category}</span></button>)}{filtered.length===0&&<p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No matching templates. Try another search.</p>}</aside>
      <article className="min-w-0 space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><Badge variant="outline">{selected.category}</Badge><h2 className="mt-2 text-xl font-semibold">{selected.title}</h2></div><button type="button" onClick={()=>copyText(fullText,"template")} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted"><Copy className="h-4 w-4"/>{copied==="template"?"Copied":"Copy template"}</button></div>
        <p className="text-sm leading-6 text-muted-foreground">{selected.purpose}</p>
        <div className="rounded-xl bg-muted/50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Typical trigger</p><p className="mt-1 text-sm leading-6">{selected.trigger}</p></div>
        <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</label><div className="mt-1 flex gap-2"><input readOnly value={selected.subject} className="h-10 min-w-0 flex-1 rounded-md border bg-muted/30 px-3 text-sm"/><button type="button" onClick={()=>copyText(selected.subject,"subject")} className="rounded-md border px-3 hover:bg-muted" aria-label="Copy subject"><Copy className="h-4 w-4"/></button></div></div>
        <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email body</label><textarea readOnly value={selected.body} rows={12} className="mt-1 w-full rounded-md border bg-muted/30 p-3 font-mono text-xs leading-6"/></div>
        <div><h3 className="text-sm font-semibold">Variables used in this template</h3><div className="mt-2 flex flex-wrap gap-2">{selected.variables.map(item=><button key={item} type="button" onClick={()=>setSampleValues(current=>({...current,[item]:current[item]||sampleFor(item)}))} className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted" title="Click to add a sample value">{'{{'+item+'}}'}</button>)}</div><p className="mt-2 text-xs text-muted-foreground">Click a variable to populate its sample value in the preview below. These are illustrative placeholders; confirm the actual variable names and syntax supported by your Saviynt tenant.</p></div>
        <div className="rounded-xl border p-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Sample preview</h3><button type="button" onClick={()=>setSampleValues({})} className="text-xs text-primary hover:underline">Clear sample values</button></div><div className="mt-3 space-y-2"><p className="text-sm font-semibold">{render(selected.subject)}</p><pre className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{render(selected.body)}</pre></div><button type="button" onClick={()=>copyText(`Subject: ${render(selected.subject)}\n\n${render(selected.body)}`,"preview")} className="mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted"><Copy className="h-4 w-4"/>{copied==="preview"?"Copied preview":"Copy preview"}</button></div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3"><h3 className="text-sm font-semibold">Implementation notes</h3><ul className="mt-2 space-y-1.5">{selected.notes.map(item=><li key={item} className="text-sm leading-5 text-muted-foreground">• {item}</li>)}</ul></div>
      </article>
    </div>
    <section className="rounded-2xl border bg-card p-4 sm:p-5"><h2 className="font-semibold">Email notification implementation checklist</h2><ol className="mt-3 grid gap-3 sm:grid-cols-2">{["Identify the exact event, workflow state or scheduled job that should send the email.","Confirm recipient resolution: requester, approver, reviewer, manager, application owner or support queue.","Verify supported template variables and their source values in the tenant release.","Configure subject, body, secure portal links and appropriate sender details.","Validate SMTP / mail relay connectivity, DNS, TLS, sender authorization and allowlisting with the mail team.","Test success, failure, retry, duplicate notification, missing-variable and escalation scenarios.","Review message content for PII, secrets, internal diagnostics and least-privilege recipient scope.","Capture delivery evidence and document operational ownership and troubleshooting steps."].map((item,index)=><li key={item} className="flex gap-2 text-sm leading-6"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index+1}</span><span>{item}</span></li>)}</ol></section>
    <p className="text-xs text-muted-foreground">These are reusable learning examples, not prevalidated Saviynt EIC template exports. Variable tokens, template storage locations, event bindings, mail settings and UI labels vary by release and tenant. Confirm them in your environment before deployment. No email is sent by this learning page.</p>
  </div>;
}

function sampleFor(key: string) {
  const values: Record<string,string> = {
    requesterName: "Alex Morgan", approverName: "Priya Sharma", recipientName: "IGA Support Team",
    userName: "Alex Morgan", reviewerName: "Jordan Lee", assigneeName: "Priya Sharma",
    identityName: "Alex Morgan", requestId: "REQ-10482", taskId: "TASK-20914",
    applicationName: "SAP S/4HANA", accessName: "Finance Reporting", submittedDate: "10 Nov 2026",
    approvalDate: "10 Nov 2026", completedDate: "10 Nov 2026", decisionDate: "10 Nov 2026",
    eventDateTime: "10 Nov 2026, 10:30 IST", dueDate: "17 Nov 2026", campaignName: "Q4 Finance Access Review",
    reviewScope: "Finance application access", itemCount: "24", pendingCount: "6", daysOverdue: "0",
    requestStatus: "Pending approval", fulfilmentStatus: "Provisioning queued", taskStatus: "Failed - investigation required",
    businessJustification: "Required for month-end finance reporting", decisionComments: "Access is not required for the current job responsibilities.",
    failureSummary: "Target application returned an account validation error", workflowName: "Finance access request",
    taskName: "Application owner approval", accountName: "alex.morgan", passwordAction: "Password changed",
    accountAction: "Account updated"
  };
  return values[key] ?? `Sample ${key}`;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>;
}

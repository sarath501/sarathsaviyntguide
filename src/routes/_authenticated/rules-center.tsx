import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, CheckCircle2, ChevronDown, CircleHelp, Code2, Filter, GitBranch, Search, ShieldCheck, Workflow } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rules-center")({ component: RulesCenter });

type RuleGuide = {
  id: string; title: string; family: string; level: string; purpose: string; when: string;
  example: string; condition: string; actions: string[]; steps: string[]; trigger: string[];
  cautions: string[];
};

const GUIDES: RuleGuide[] = [
  {
    id: "technical", title: "Technical Rules", family: "Lifecycle & provisioning", level: "Core", purpose: "Evaluate identity attributes against configured conditions and initiate access-related actions, commonly used for birthright provisioning.",
    when: "Use when access should be assigned or evaluated because an identity is created/imported or when a rule is explicitly re-evaluated for existing identities.",
    example: "Birthright access for active employees in the Bangalore office: assign the standard employee role and the baseline collaboration entitlement.",
    condition: "Conceptual condition (not Saviynt query syntax): userType = 'Employee' AND status = 'Active' AND city = 'Bangalore'",
    actions: ["Select the relevant access object/action supported by the tenant, such as a role or entitlement assignment.", "Configure the Birthright behavior when the rule is intended to grant baseline access.", "Where appropriate, configure removal of access granted by this birthright rule when its condition no longer matches."],
    steps: ["Open Admin → Policies → Technical Rules (menu labels may vary by EIC release and permissions).", "Choose Actions → Create Technical Rule.", "Enter a clear name, description, owner and applicable rule details.", "Define and validate the identity condition; use preview/matching-user capabilities where available.", "Configure the access object and action. Enable Birthright for baseline lifecycle access when appropriate.", "Submit for the configured approval process and confirm the rule reaches its effective/active state.", "Test with a controlled non-production identity, then verify generated tasks and target-side outcome."],
    trigger: ["New identity creation in EIC", "User import, where the relevant zero-day/birthright provisioning options are enabled", "Supported provisioning-rule execution or scheduled re-evaluation for existing users"],
    cautions: ["Birthright is a use of a Technical Rule, not a separate rule family.", "Do not assume a rule runs for every update automatically; confirm the configured trigger/job and the tenant's release behavior.", "Removal-on-condition-failure should remove only access managed by that birthright rule. Validate ownership and exceptions before enabling it.", "Avoid broad conditions such as status is not blank; test nulls, case sensitivity and boundary values."]
  },
  {
    id: "user-update", title: "User Update Rules", family: "Lifecycle & provisioning", level: "Core", purpose: "React to changes in identity attributes and drive lifecycle actions such as mover, leaver and rehire processing.",
    when: "Use when an identity attribute changes, for example department, location, employee status, manager or employment end date.",
    example: "Mover: when an active employee changes from Sales to Finance, initiate removal of Sales-specific access and evaluate Finance access eligibility.",
    condition: "Conceptual condition: status = 'Active' AND department changed from 'Sales' to 'Finance'",
    actions: ["Trigger configured lifecycle or technical-rule actions.", "Remove or update access that is no longer justified, based on approved policy.", "Apply leaver actions when employment status or end-date criteria are met."],
    steps: ["Open Admin → Policies → User Update Rules.", "Choose the create-rule action and provide a descriptive name and owner.", "Define the identity-change conditions and the attributes/events that should cause evaluation.", "Configure the required actions, linked rules or access-removal behavior supported by the tenant.", "Submit for approval and verify the rule is active.", "Test old-value/new-value combinations for mover, leaver and rehire scenarios.", "Validate pending tasks, provisioning results and audit evidence."],
    trigger: ["Supported user attribute update events", "Configured user-update-rule execution or scheduled jobs", "A lifecycle event that matches the configured condition"],
    cautions: ["A mover design must consider both add-access and remove-access outcomes.", "For leavers, prioritize timely disablement and downstream revocation according to policy.", "Test future-dated terminations, rehires, missing manager data and repeated events.", "Exact event triggers and action choices vary by tenant configuration and EIC release."]
  },
  {
    id: "access-policy", title: "Access Policies", family: "Policy & request governance", level: "Core", purpose: "Define policy-driven access eligibility and governance for lifecycle events, requests and governed data access.",
    when: "Use to define which access should be available or assigned for joiner, mover and leaver scenarios, access-request contexts, or data access governance use cases.",
    example: "A Finance employee can request the Finance Reporting role; a policy can require manager and application-owner approval and apply risk/SoD checks.",
    condition: "Conceptual policy: department = 'Finance' AND employmentStatus = 'Active' AND requestedApplication = 'Finance Reporting'",
    actions: ["Define eligibility and policy scope.", "Associate the relevant request, workflow, approval or governance controls.", "Use lifecycle-specific policy logic where supported."],
    steps: ["Identify the policy use case: joiner, mover, leaver, access request or data access governance.", "Confirm the source attributes and access objects that determine eligibility.", "Configure the policy and associated workflow/approval controls in the relevant EIC area.", "Apply risk and SoD checks where required by the control design.", "Test eligible and ineligible identities, exceptions and approval outcomes.", "Document policy ownership, review cadence and change approval."],
    trigger: ["Lifecycle events", "Access-request evaluation", "Configured data-access governance processes"],
    cautions: ["Access Policies are broader policy controls; do not confuse them with the Technical Rule object used for birthright provisioning.", "The exact configuration page and policy options depend on enabled EIC capabilities and release."]
  },
  {
    id: "entitlement-update", title: "Entitlement Update Rules", family: "Policy & request governance", level: "Advanced", purpose: "Support governance actions associated with changes to entitlements, including event-driven review use cases where configured.",
    when: "Use when an entitlement change should initiate a governance response, such as a review or reassessment of affected access.",
    example: "A sensitive SAP role is modified or assigned; the governance design initiates an event-based review or downstream control process.",
    condition: "Conceptual condition: entitlement = 'SAP_Payments_Admin' AND changeType IN ('Added','Modified')",
    actions: ["Define the entitlement event and affected population.", "Configure the supported governance action, such as event-based certification where available.", "Ensure reviewer ownership, evidence and remediation paths are defined."],
    steps: ["Confirm the entitlement object, endpoint and event types available in the tenant.", "Define which entitlement changes are in scope and which identities are affected.", "Configure the entitlement update rule and supported downstream governance action.", "Define reviewer/owner assignment, campaign scope and remediation behavior.", "Test add, update and remove events in a non-production environment.", "Verify that the expected governance tasks and audit evidence are generated."],
    trigger: ["Configured entitlement update events", "Supported event-based certification or governance processing"],
    cautions: ["Do not assume every entitlement attribute update triggers a campaign; verify the configured event and product capability.", "This is not a substitute for access request approval or SoD policy evaluation."]
  },
  {
    id: "sod", title: "SoD Rulesets, Functions & Risks", family: "Risk & compliance", level: "Advanced", purpose: "Model incompatible business activities and evaluate access combinations for segregation-of-duties conflicts.",
    when: "Use when combinations of entitlements or business functions create financial, operational or compliance risk.",
    example: "A user must not both create a supplier and approve supplier payments. Model the activities as functions and the incompatible combination as a risk.",
    condition: "Conceptual conflict: Function A = 'Create Supplier' AND Function B = 'Approve Supplier Payment'",
    actions: ["Create or maintain functions that represent business activities.", "Define risks from incompatible function combinations.", "Group risks into a ruleset and configure preventative/detective evaluation and mitigating controls as supported."],
    steps: ["Inventory business processes and identify incompatible duties with control owners.", "Map entitlements to the relevant functions.", "Define risks using the conflicting function combinations.", "Organize risks into a ruleset and configure severity/ownership.", "Enable the appropriate preventative request-time and/or detective analysis.", "Define exception and mitigating-control approval paths.", "Test conflict detection, false positives, mitigation and remediation."],
    trigger: ["Access request or approval-time analysis when preventative SoD is configured", "Scheduled or campaign-based detective review processes"],
    cautions: ["SoD rulesets are a governance model, not the same object as Technical Rules or User Update Rules.", "A conflict does not always mean automatic revocation; follow the approved risk and mitigation process.", "Entitlement-to-function mapping quality determines the usefulness of SoD results."]
  }
];

const FAMILIES = ["All", "Lifecycle & provisioning", "Policy & request governance", "Risk & compliance"];

function RulesCenter() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("All");
  const [selected, setSelected] = useState("technical");
  const guide = GUIDES.find(item => item.id === selected) ?? GUIDES[0];
  const filtered = useMemo(() => GUIDES.filter(item => (family === "All" || item.family === family) && (query.trim().length === 0 || (item.title + " " + item.purpose + " " + item.example + " " + item.family).toLowerCase().includes(query.toLowerCase()))), [family, query]);

  return <div className="space-y-6">
    <PageHeader title="Saviynt Rules Learning Center" subtitle="Understand rule families, when to use them, how to configure them, and how they behave in common IGA scenarios." />
    <section className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <div className="flex items-start gap-3"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-primary"/><div><h2 className="font-semibold">Important distinction: Technical Rule vs Birthright</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Birthright is not a separate rule type. It is a baseline-access use case configured through a Technical Rule and its birthright behavior. A Technical Rule evaluates identity conditions and can assign access; birthright describes the baseline access being granted to eligible identities.</p></div></div>
    </section>

    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border bg-card p-4"><Workflow className="h-5 w-5 text-primary"/><p className="mt-2 text-sm text-muted-foreground">Rule families covered</p><p className="text-2xl font-semibold">5</p></div>
      <div className="rounded-xl border bg-card p-4"><GitBranch className="h-5 w-5 text-primary"/><p className="mt-2 text-sm text-muted-foreground">Configuration walkthroughs</p><p className="text-2xl font-semibold">5</p></div>
      <div className="rounded-xl border bg-card p-4"><ShieldCheck className="h-5 w-5 text-primary"/><p className="mt-2 text-sm text-muted-foreground">Example use cases</p><p className="text-2xl font-semibold">5+</p></div>
    </section>

    <section className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search rules, examples, mover, leaver, birthright..." className="pl-9"/></div>
        <div className="flex flex-wrap gap-2">{FAMILIES.map(item=><button key={item} type="button" onClick={()=>setFamily(item)} className={"rounded-lg border px-3 py-2 text-xs font-medium "+(family===item?"border-primary bg-primary/10 text-primary":"hover:bg-muted")}>{item}</button>)}</div>
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground"><Filter className="h-3 w-3"/>{filtered.length} rule guides</p>
    </section>

    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-2">
        {filtered.map(item=><button key={item.id} type="button" onClick={()=>setSelected(item.id)} className={"w-full rounded-xl border p-3 text-left transition "+(selected===item.id?"border-primary bg-primary/5":"bg-card hover:bg-muted")}><span className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{item.title}</span>{selected===item.id&&<CheckCircle2 className="h-4 w-4 text-primary"/>}</span><span className="mt-1 block text-xs text-muted-foreground">{item.family}</span><span className="mt-2 block"><Badge variant="outline">{item.level}</Badge></span></button>)}
        {filtered.length===0&&<p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No matching rule guides. Try another keyword or category.</p>}
      </aside>

      {filtered.some(item=>item.id===selected)?<article className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{guide.family}</Badge><Badge>{guide.level}</Badge></div>
        <h2 className="mt-3 text-2xl font-semibold">{guide.title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{guide.purpose}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">When to use</p><p className="mt-2 text-sm leading-6">{guide.when}</p></div>
          <div className="rounded-xl bg-muted/60 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Practical example</p><p className="mt-2 text-sm leading-6">{guide.example}</p></div>
        </div>
        <section className="mt-5"><h3 className="flex items-center gap-2 font-semibold"><Code2 className="h-4 w-4 text-primary"/>Illustrative condition</h3><pre className="mt-2 overflow-x-auto rounded-xl border bg-muted/40 p-3 text-xs leading-6 whitespace-pre-wrap">{guide.condition}</pre><p className="mt-2 text-xs text-muted-foreground">This is logical pseudocode to explain the condition. It is not a copy-paste Saviynt query or JSON payload.</p></section>
        <section className="mt-5"><h3 className="font-semibold">Typical actions / configuration outcomes</h3><ul className="mt-2 space-y-2">{guide.actions.map(item=><li key={item} className="flex gap-2 text-sm leading-6"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary"/>{item}</li>)}</ul></section>
        <section className="mt-5"><h3 className="font-semibold">How to create and configure</h3><ol className="mt-2 space-y-2">{guide.steps.map((item,index)=><li key={item} className="flex gap-3 text-sm leading-6"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{index+1}</span><span>{item}</span></li>)}</ol></section>
        <section className="mt-5"><h3 className="font-semibold">Triggers and execution</h3><ul className="mt-2 space-y-2">{guide.trigger.map(item=><li key={item} className="flex gap-2 text-sm leading-6"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"/>{item}</li>)}</ul></section>
        <section className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><h3 className="font-semibold">Important implementation checks</h3><ul className="mt-2 space-y-2">{guide.cautions.map(item=><li key={item} className="flex gap-2 text-sm leading-6"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600"/>{item}</li>)}</ul></section>
      </article>:<div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">Select a rule guide to view examples and configuration details.</div>}
    </div>

    <section className="rounded-2xl border bg-card p-5">
      <h2 className="font-semibold">Quick comparison</h2>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-xs"><thead><tr className="border-b text-muted-foreground"><th className="p-2">Capability</th><th className="p-2">Primary purpose</th><th className="p-2">Typical scenario</th></tr></thead><tbody>
        <tr className="border-b"><td className="p-2 font-medium">Technical Rule</td><td className="p-2">Condition-based access assignment</td><td className="p-2">Birthright / baseline access</td></tr>
        <tr className="border-b"><td className="p-2 font-medium">User Update Rule</td><td className="p-2">React to identity changes</td><td className="p-2">Mover / leaver / rehire</td></tr>
        <tr className="border-b"><td className="p-2 font-medium">Access Policy</td><td className="p-2">Govern access eligibility and request controls</td><td className="p-2">Joiner / request / data access</td></tr>
        <tr className="border-b"><td className="p-2 font-medium">Entitlement Update Rule</td><td className="p-2">Respond to entitlement changes</td><td className="p-2">Event-based review</td></tr>
        <tr><td className="p-2 font-medium">SoD Ruleset</td><td className="p-2">Evaluate conflicting business functions</td><td className="p-2">Supplier create + payment approve</td></tr>
      </tbody></table></div>
    </section>
    <p className="text-xs text-muted-foreground">Saviynt EIC capabilities, labels, trigger behavior and available actions can vary by release, tenant configuration and licensing. Treat the walkthroughs as implementation learning guidance; validate exact fields, query syntax and job names in your tenant's current documentation before using them in production.</p>
  </div>;
}

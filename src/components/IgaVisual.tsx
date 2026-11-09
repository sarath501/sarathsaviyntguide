import { ArrowRight, ArrowDown, Users, ShieldCheck, AppWindow, ScanEye, FileCheck2, Network, Database, Cloud, Globe, Cable, FolderSync, Building2, UserRoundCog, Workflow, KeyRound, Scale } from "lucide-react";

// Original technology symbols, not vendor trademarks or purported official logos.
export function TechnologyIcon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  const lower = name.toLowerCase();
  const Icon = /sql|jdbc|oracle|database/.test(lower) ? Database : /entra|cloud/.test(lower) ? Cloud : /directory|ldap/.test(lower) ? Network : /rest|scim|api/.test(lower) ? Globe : /sftp|file/.test(lower) ? FolderSync : /workday|hr/.test(lower) ? Users : /sap|erp/.test(lower) ? Building2 : /servicenow/.test(lower) ? Workflow : Cable;
  return <Icon className={className} aria-hidden="true" />;
}

const stages = [
  { icon: Users, name: "Identity Sources", detail: "HR · Directories · Cloud" },
  { icon: ShieldCheck, name: "Saviynt EIC", detail: "Identity control plane" },
  { icon: AppWindow, name: "Applications", detail: "Provisioning · Integrations" },
  { icon: ScanEye, name: "Access Governance", detail: "Requests · Reviews · SoD" },
  { icon: FileCheck2, name: "Compliance", detail: "Audit · Risk · Evidence" },
];

export function ArchitectureFlow() {
  return (
    <figure className="architecture-flow" aria-label="Illustrative IGA architecture: Identity Sources to Saviynt EIC to Applications to Access Governance to Compliance">
      <figcaption className="mb-6 flex flex-wrap items-center justify-between gap-2 text-xs text-navy-muted"><span>IDENTITY GOVERNANCE ARCHITECTURE</span><span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-success" />Illustrative learning model</span></figcaption>
      <ol className="grid gap-3 md:grid-cols-5 md:gap-6">
        {stages.map((s, i) => <li key={s.name} className="relative flex items-center gap-4 md:flex-col md:items-start">
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${i === 1 ? "border-electric bg-primary text-primary-foreground" : "border-navy-line bg-sidebar-accent text-electric"}`}><s.icon className="h-6 w-6" /></span>
          <div className="min-w-0"><p className="text-sm font-semibold text-navy-foreground">{s.name}</p><p className="mt-1 text-xs text-navy-muted">{s.detail}</p></div>
          {i < stages.length - 1 && <><ArrowRight className="absolute -right-5 top-4 hidden h-4 w-4 text-electric md:block" aria-hidden="true" /><ArrowDown className="absolute left-4 top-12 h-4 w-4 text-electric md:hidden" aria-hidden="true" /></>}
        </li>)}
      </ol>
    </figure>
  );
}

export function GovernanceVisuals() {
  const flows = [
    { icon: UserRoundCog, title: "Identity lifecycle", steps: "Join → Move → Leave" },
    { icon: Workflow, title: "Access requests", steps: "Request → Approve → Provision" },
    { icon: FileCheck2, title: "Certification", steps: "Review → Decide → Remediate" },
    { icon: KeyRound, title: "RBAC", steps: "Identity → Role → Access" },
    { icon: Scale, title: "Segregation of duties", steps: "Access → Conflict → Mitigation" },
  ];
  return <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">{flows.map((f) => <div key={f.title} className="border-t-2 border-primary/25 pt-4"><f.icon className="mb-3 h-5 w-5 text-primary" /><h3 className="text-sm font-semibold">{f.title}</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.steps}</p></div>)}</div>;
}

export function PortalFooter() {
  return <footer className="bg-navy px-6 py-9 text-navy-foreground"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 md:flex-row"><div><p className="font-display text-lg font-semibold">Sarath IGA Learning Portal</p><p className="mt-2 max-w-md text-sm text-navy-muted">Learn Identity Governance. Master Saviynt. Build Your IAM Career.</p></div><div className="max-w-sm text-xs leading-relaxed text-navy-muted"><p>Independent learning resource. Not affiliated with or endorsed by Saviynt.</p><p className="mt-3">Facing an issue? <a className="underline hover:text-navy-foreground" href="mailto:avalasarath01@gmail.com">Email support</a> · <a className="underline hover:text-navy-foreground" href="tel:+919606032995">Call +91 9606032995</a></p><p className="mt-3">© {new Date().getFullYear()} Sarath IGA Learning Portal</p></div></div></footer>;
}
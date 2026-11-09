import { useEffect, useState, type ReactNode } from "react";
import { ZoomIn, ZoomOut, Play, Pause, Maximize2, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DIAGRAMS, type ConnectorDef, type FlowDef } from "@/lib/diagrams";

type Info = { title: string; detail: string } | null;

function Frame({ title, legend, controls, info, children }: { title: string; legend?: string | undefined; controls?: ReactNode; info: Info; children: ReactNode }) {
  const [zoom, setZoom] = useState(1);
  return (
    <figure className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2">
        <figcaption className="text-sm font-semibold">{title}</figcaption>
        <div className="flex flex-wrap items-center gap-1">
          {controls}
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
          <span className="w-10 text-center font-mono text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(2, z + 0.2))} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="overflow-auto p-4">
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "top left", width: `${100 / zoom}%` }}>{children}</div>
      </div>
      <div className="min-h-16 border-t bg-accent/40 px-4 py-3 text-sm">
        {info ? <><p className="font-semibold">{info.title}</p><p className="text-muted-foreground">{info.detail}</p></> : <p className="text-muted-foreground">Click any component to see its explanation.</p>}
        {legend && <p className="mt-2 text-xs text-muted-foreground">Legend: {legend}</p>}
      </div>
    </figure>
  );
}

function FlowDiagram({ def }: { def: FlowDef }) {
  const [active, setActive] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const lanes = def.lanes ?? [{ id: "_", label: "" }];
  const order = def.nodes.map((n) => n.id);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setActive((a) => {
        const i = a ? order.indexOf(a) : -1;
        if (i >= order.length - 1) { setPlaying(false); return a; }
        return order[i + 1] ?? null;
      });
    }, 1400);
    return () => clearInterval(t);
  }, [playing, order]);
  const node = def.nodes.find((n) => n.id === active);
  const activeIdx = active ? order.indexOf(active) : -1;
  return (
    <Frame title={def.title} legend={def.legend ?? "Boxes are process steps; arrows show the order of execution. Use Play to animate the flow."} info={node ? { title: node.label, detail: node.detail } : null}
      controls={<Button size="sm" variant="secondary" className="h-8" onClick={() => { if (!playing && activeIdx >= order.length - 1) setActive(null); setPlaying((p) => !p); }}>{playing ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}{playing ? "Pause" : "Play steps"}</Button>}>
      <div className="space-y-4">
        {lanes.map((lane) => {
          const nodes = def.nodes.filter((n) => (n.lane ?? "_") === lane.id);
          return (
            <div key={lane.id}>
              {lane.label && <p className="mb-2 font-mono text-xs uppercase tracking-wider text-primary">{lane.label}</p>}
              <ol className="flex flex-wrap items-stretch gap-y-3">
                {nodes.map((n, i) => {
                  const idx = order.indexOf(n.id);
                  const on = n.id === active;
                  const past = activeIdx >= 0 && idx < activeIdx;
                  return (
                    <li key={n.id} className="flex items-center">
                      <button onClick={() => { setPlaying(false); setActive(n.id); }}
                        className={`w-36 rounded-lg border-2 px-3 py-2 text-left text-xs transition-all ${on ? "scale-105 border-primary bg-primary text-primary-foreground shadow-card" : past ? "border-primary/50 bg-accent" : "border-border bg-card hover:border-primary/60"}`}>
                        <span className={`block font-mono text-[10px] ${on ? "text-primary-foreground/80" : "text-muted-foreground"}`}>STEP {i + 1}</span>
                        <span className="font-medium">{n.label}</span>
                      </button>
                      {i < nodes.length - 1 && (
                        <svg width="28" height="16" viewBox="0 0 28 16" className="shrink-0" aria-hidden="true">
                          <path d="M2 8h20" stroke={past || on ? "var(--primary)" : "var(--muted-foreground)"} strokeWidth="2" className={on ? "flow-dash" : ""} />
                          <path d="M20 3l6 5-6 5" fill="none" stroke={past || on ? "var(--primary)" : "var(--muted-foreground)"} strokeWidth="2" />
                        </svg>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </Frame>
  );
}

type Box = { id: string; x: number; y: number; w: number; h: number; label: string; detail: string; group?: "src" | "eic" | "tgt" | "core" };

const ARCH_DETAILED: Box[] = [
  { id: "hr", x: 10, y: 20, w: 150, h: 44, label: "HR Systems", detail: "Workday / SuccessFactors — the authoritative identity source driving joiner, mover and leaver events.", group: "src" },
  { id: "ad", x: 10, y: 80, w: 150, h: 44, label: "Active Directory", detail: "Directory accounts and groups; both imported and provisioned.", group: "src" },
  { id: "sap", x: 10, y: 140, w: 150, h: 44, label: "SAP Applications", detail: "SAP ECC / S/4HANA users and roles, including fine-grained SoD data.", group: "src" },
  { id: "ora", x: 10, y: 200, w: 150, h: 44, label: "Oracle Applications", detail: "Oracle DB / EBS users and responsibilities.", group: "src" },
  { id: "conn", x: 200, y: 20, w: 120, h: 224, label: "Connectors", detail: "Connector framework (LDAP, JDBC, REST, SCIM, SAP JCo, files) plus the connector gateway for on-prem systems. Moves data in (imports) and out (provisioning).", group: "core" },
  { id: "repo", x: 360, y: 20, w: 300, h: 44, label: "Identity Repository", detail: "The identity warehouse: users, accounts, entitlements and their relationships — the single source of truth for 'who has access to what'.", group: "eic" },
  { id: "req", x: 360, y: 80, w: 140, h: 44, label: "Access Requests", detail: "Self-service catalogue of applications, roles and entitlements.", group: "eic" },
  { id: "wf", x: 520, y: 80, w: 140, h: 44, label: "Approval Workflows", detail: "Manager, owner and risk-based approvals with escalation.", group: "eic" },
  { id: "prov", x: 360, y: 140, w: 300, h: 44, label: "Provisioning Engine", detail: "Turns approved changes, rules and revocations into tasks executed through connectors.", group: "eic" },
  { id: "cert", x: 360, y: 200, w: 140, h: 44, label: "Access Certification", detail: "Campaigns where reviewers attest or revoke access.", group: "eic" },
  { id: "ana", x: 520, y: 200, w: 140, h: 44, label: "Analytics & Reporting", detail: "SQL-based analytics, controls, dashboards and audit reports.", group: "eic" },
  { id: "tgt", x: 700, y: 20, w: 140, h: 224, label: "Target Applications", detail: "Business applications (SaaS, on-prem, databases) where accounts and entitlements are provisioned.", group: "tgt" },
];
const ARCH_OVERVIEW: Box[] = [
  { id: "src", x: 10, y: 60, w: 180, h: 140, label: "Identity Sources", detail: "HR systems, Active Directory, SAP, Oracle and other applications feeding identities and access data.", group: "src" },
  { id: "eic", x: 270, y: 30, w: 320, h: 200, label: "Saviynt EIC", detail: "Cloud IGA platform: identity repository, requests, workflows, provisioning, certification and analytics.", group: "eic" },
  { id: "tgt", x: 670, y: 60, w: 170, h: 140, label: "Target Applications", detail: "Systems where EIC provisions and governs access.", group: "tgt" },
];
const ARCH_EDGES_D: [string, string][] = [["hr", "conn"], ["ad", "conn"], ["sap", "conn"], ["ora", "conn"], ["conn", "repo"], ["req", "wf"], ["wf", "prov"], ["repo", "cert"], ["repo", "ana"], ["prov", "tgt"]];
const ARCH_EDGES_O: [string, string][] = [["src", "eic"], ["eic", "tgt"]];

function fillFor(g: Box["group"], on: boolean) {
  if (on) return "var(--primary)";
  return g === "eic" ? "var(--accent)" : g === "core" ? "var(--secondary)" : "var(--card)";
}

function BoxDiagram({ title, boxes, edges, height, legend, extraControls }: { title: string; boxes: Box[]; edges: [string, string][]; height: number; legend: string; extraControls?: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const [flowOn, setFlowOn] = useState(true);
  const byId = Object.fromEntries(boxes.map((b) => [b.id, b]));
  const a = active ? byId[active] : undefined;
  return (
    <Frame title={title} legend={legend} info={a ? { title: a.label, detail: a.detail } : null}
      controls={<>{extraControls}<Button size="sm" variant={flowOn ? "secondary" : "ghost"} className="h-8" onClick={() => setFlowOn((f) => !f)}><Waypoints className="mr-1 h-3.5 w-3.5" />Data flow</Button></>}>
      <svg viewBox={`0 0 850 ${height}`} className="w-full min-w-[640px]" role="img" aria-label={title}>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--primary)" /></marker>
        </defs>
        {boxes.some((b) => b.group === "eic") && boxes.length > 3 && (
          <rect x="345" y="6" width="330" height={height - 14} rx="12" fill="none" stroke="var(--primary)" strokeDasharray="6 4" opacity="0.5" />
        )}
        {edges.map(([f, t]) => {
          const s = byId[f], d = byId[t];
          if (!s || !d) return null;
          const horizontal = d.x >= s.x + s.w - 1;
          const x1 = horizontal ? s.x + s.w : s.x + s.w / 2, y1 = horizontal ? s.y + s.h / 2 : s.y + s.h;
          const x2 = horizontal ? d.x : d.x + d.w / 2, y2 = horizontal ? Math.min(Math.max(s.y + s.h / 2, d.y + 10), d.y + d.h - 10) : d.y;
          const hl = active === f || active === t;
          return <line key={f + t} x1={x1} y1={y1} x2={x2 - (horizontal ? 2 : 0)} y2={y2 - (horizontal ? 0 : 2)} stroke="var(--primary)" strokeWidth={hl ? 3 : 1.6} markerEnd="url(#arr)" className={flowOn ? "flow-dash" : ""} opacity={active && !hl ? 0.35 : 1} />;
        })}
        {boxes.map((b) => {
          const on = b.id === active;
          return (
            <g key={b.id} onClick={() => setActive(b.id)} className="cursor-pointer" role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setActive(b.id)}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="8" fill={fillFor(b.group, on)} stroke={on ? "var(--primary)" : "var(--border)"} strokeWidth="1.5" />
              <text x={b.x + b.w / 2} y={b.y + b.h / 2} textAnchor="middle" dominantBaseline="middle" fontSize="12" fontWeight="600" fill={on ? "var(--primary-foreground)" : "var(--foreground)"} fontFamily="var(--font-sans)">{b.label}</text>
            </g>
          );
        })}
        {boxes.length > 3 && <text x="510" y={height - 2} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">Saviynt Enterprise Identity Cloud</text>}
      </svg>
    </Frame>
  );
}

function ArchitectureDiagram({ title }: { title: string }) {
  const [detailed, setDetailed] = useState(true);
  return (
    <BoxDiagram key={String(detailed)} title={title} boxes={detailed ? ARCH_DETAILED : ARCH_OVERVIEW} edges={detailed ? ARCH_EDGES_D : ARCH_EDGES_O} height={detailed ? 262 : 250}
      legend="Arrows show the direction of data flow: sources → connectors → EIC → target applications. Dashed outline = EIC platform."
      extraControls={<Button size="sm" variant="ghost" className="h-8" onClick={() => setDetailed((d) => !d)}><Maximize2 className="mr-1 h-3.5 w-3.5" />{detailed ? "Overview" : "Detailed"}</Button>} />
  );
}

const MODEL: Box[] = [
  { id: "ss", x: 10, y: 20, w: 150, h: 44, label: "Security System", detail: "Logical container grouping endpoints and their connection(s).", group: "core" },
  { id: "ep", x: 220, y: 20, w: 150, h: 44, label: "Endpoint", detail: "Represents the target application (ENDPOINTS table).", group: "eic" },
  { id: "acc", x: 430, y: 20, w: 150, h: 44, label: "Account", detail: "An account in the target system (ACCOUNTS). Linked to users through USER_ACCOUNTS.", group: "eic" },
  { id: "ev", x: 640, y: 20, w: 190, h: 44, label: "Entitlement Value", detail: "A specific group/role/permission (ENTITLEMENT_VALUES). Linked to accounts through ACCOUNT_ENTITLEMENTS1.", group: "eic" },
  { id: "et", x: 640, y: 120, w: 190, h: 44, label: "Entitlement Type", detail: "Category of entitlement for an endpoint, e.g. Group, Role, Profile (ENTITLEMENT_TYPES).", group: "core" },
  { id: "usr", x: 430, y: 120, w: 150, h: 44, label: "User (Identity)", detail: "The person or non-human identity (USERS), usually sourced from HR.", group: "src" },
  { id: "conn2", x: 10, y: 120, w: 150, h: 44, label: "Connection", detail: "Technical configuration used by imports and provisioning for the security system.", group: "core" },
];
const MODEL_EDGES: [string, string][] = [["ss", "ep"], ["ep", "acc"], ["acc", "ev"], ["et", "ev"], ["usr", "acc"], ["conn2", "ss"]];

function ConnectorDiagram({ def }: { def: ConnectorDef }) {
  const [active, setActive] = useState<Info>(null);
  const both = def.direction === "both", inbound = def.direction !== "outbound";
  const List = ({ title, items, k }: { title: string; items: string[]; k: string }) => (
    <button onClick={() => setActive({ title, detail: items.join(" · ") })} className="rounded-lg border bg-card p-3 text-left text-xs hover:border-primary/60" key={k}>
      <p className="mb-1 font-semibold">{title}</p>
      <ul className="list-disc space-y-0.5 pl-4 text-muted-foreground">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </button>
  );
  return (
    <Frame title={def.title} legend="Left: the connected system. Arrows show data exchanged with Saviynt EIC (imports flow right, provisioning flows left)." info={active}>
      <svg viewBox="0 0 820 150" className="w-full min-w-[600px]" role="img" aria-label={def.title}>
        <defs><marker id="arr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--primary)" /></marker></defs>
        {[
          { x: 10, label: def.system, sub: "Target / source system", detail: `The connected system. Prerequisites: ${def.prerequisites.join("; ")}.`, fill: "var(--card)" },
          { x: 310, label: "Connector", sub: def.protocol, detail: `Communicates over ${def.protocol}. Configured as a connection in EIC; on-prem systems are reached through the connector gateway.`, fill: "var(--secondary)" },
          { x: 610, label: "Saviynt EIC", sub: "Identity warehouse & engines", detail: `Supports: ${def.processes.join(", ")}.`, fill: "var(--accent)" },
        ].map((b) => (
          <g key={b.x} className="cursor-pointer" onClick={() => setActive({ title: b.label, detail: b.detail })}>
            <rect x={b.x} y={35} width="200" height="80" rx="10" fill={b.fill} stroke="var(--border)" strokeWidth="1.5" />
            <text x={b.x + 100} y={68} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--foreground)">{b.label}</text>
            <text x={b.x + 100} y={90} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">{b.sub.length > 34 ? b.sub.slice(0, 33) + "…" : b.sub}</text>
          </g>
        ))}
        {inbound && <><line x1="212" y1="62" x2="306" y2="62" stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arr2)" className="flow-dash" /><line x1="512" y1="62" x2="606" y2="62" stroke="var(--primary)" strokeWidth="2" markerEnd="url(#arr2)" className="flow-dash" /><text x="410" y="25" textAnchor="middle" fontSize="10" fill="var(--primary)">imports →</text></>}
        {(both || !inbound) && <><line x1="606" y1="92" x2="512" y2="92" stroke="var(--chart-3)" strokeWidth="2" markerEnd="url(#arr2)" /><line x1="306" y1="92" x2="212" y2="92" stroke="var(--chart-3)" strokeWidth="2" markerEnd="url(#arr2)" /><text x="410" y="135" textAnchor="middle" fontSize="10" fill="var(--chart-3)">← provisioning</text></>}
      </svg>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <List k="i" title="Data imported" items={def.imports} />
        <List k="p" title="Provisioning operations" items={def.provisions} />
        <List k="g" title="Governance processes" items={def.processes} />
        <List k="r" title="Prerequisites" items={def.prerequisites} />
      </div>
    </Frame>
  );
}

export function Diagram({ diagramKey }: { diagramKey: string }) {
  const def = DIAGRAMS[diagramKey];
  if (!def) return null;
  if (def.kind === "flow") return <FlowDiagram def={def} />;
  if (def.kind === "architecture") return <ArchitectureDiagram title={def.title} />;
  if (def.kind === "connector") return <ConnectorDiagram def={def} />;
  return <BoxDiagram title={def.title} boxes={MODEL} edges={MODEL_EDGES} height={180} legend="Arrows show ownership/links between objects. Table names in the explanations refer to the Saviynt schema." />;
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Bookmark, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Markdown } from "@/components/Markdown";
import { ConnectorDiagram } from "@/components/ConnectorDiagram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CONNECTOR_SECTIONS, INTERVIEW_LEVELS, connectorProgressPct, useConnectorProgress, useConnectors, type Connector } from "@/lib/connectors";

export const Route = createFileRoute("/_authenticated/connectors/$connectorId")({
  head: () => ({
    meta: [
      { title: "Connector guide — Sarath IGA Learning Portal" },
      { name: "description", content: "Saviynt connector architecture, parameters, security, jobs, troubleshooting, lab and interview questions." },
      { property: "og:title", content: "Saviynt connector guide" },
      { property: "og:description", content: "Complete technical guide for a Saviynt connector." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConnectorPage,
});

type SectionKey = (typeof CONNECTOR_SECTIONS)[number][0];
const box = "rounded-xl border bg-card p-5 shadow-card";

function ConnectorPage() {
  const { connectorId } = Route.useParams();
  const { data: list, isLoading } = useConnectors();
  const { data: prog } = useConnectorProgress();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<SectionKey>("intro");
  const c = list?.find((x) => x.id === connectorId);
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!c) return <p>Connector not found. <Link to="/connectors" className="text-primary">Back to connectors</Link></p>;

  const done = prog?.progress[c.id]?.sections_done ?? [];
  const saved = !!prog?.bookmarks.has(c.id);
  const pct = connectorProgressPct(done);

  async function markDone(key: SectionKey, extra?: { lab_done: boolean }) {
    if (!user || !c) return;
    const sections = Array.from(new Set([...done, key]));
    const { error } = await supabase.from("connector_progress").upsert({ user_id: user.id, connector_id: c.id, sections_done: sections, updated_at: new Date().toISOString(), ...extra }, { onConflict: "user_id,connector_id" });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["connector-progress"] });
  }
  async function toggleSave() {
    if (!user || !c) return;
    const r = saved
      ? await supabase.from("connector_bookmarks").delete().eq("user_id", user.id).eq("connector_id", c.id)
      : await supabase.from("connector_bookmarks").insert({ user_id: user.id, connector_id: c.id });
    if (r.error) return toast.error(r.error.message);
    qc.invalidateQueries({ queryKey: ["connector-progress"] });
  }

  const idx = CONNECTOR_SECTIONS.findIndex(([k]) => k === tab);
  const next = CONNECTOR_SECTIONS[idx + 1];
  return (
    <div>
      <Link to="/connectors" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />All connectors</Link>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{c.category}</p>
          <h1 className="font-display text-3xl font-semibold">{c.name}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{c.summary}</p>
          <div className="mt-2 flex flex-wrap gap-2"><Badge variant="secondary">{c.difficulty}</Badge><Badge variant="outline">{c.support_type}</Badge></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40"><Progress value={pct} className="h-2" /><p className="mt-1 text-xs text-muted-foreground">{pct}% complete</p></div>
          <Button variant="outline" size="sm" onClick={toggleSave}><Bookmark className={`mr-1 h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />{saved ? "Saved" : "Bookmark"}</Button>
        </div>
      </div>
      {!c.content?.overview ? (
        <div className={box}><p className="font-semibold">This guide is being written.</p><p className="text-sm text-muted-foreground">Check back shortly — an administrator can also generate or edit it from the Admin page.</p></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Sections">
            {CONNECTOR_SECTIONS.map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${tab === k ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {done.includes(k) ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0 opacity-50" />}{l}
              </button>
            ))}
          </nav>
          <div className="min-w-0 space-y-5">
            <Section c={c} tab={tab} onLabDone={() => markDone("lab", { lab_done: true })} />
            <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
              <Button variant={done.includes(tab) ? "secondary" : "default"} onClick={() => markDone(tab)} disabled={done.includes(tab)}>{done.includes(tab) ? "Section completed" : "Mark section complete"}</Button>
              {next && <Button variant="outline" onClick={() => setTab(next[0])}>Next: {next[1]} →</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function H({ children }: { children: ReactNode }) { return <h2 className="mb-3 font-display text-xl font-semibold">{children}</h2>; }
function List({ items }: { items?: string[] | undefined }) { return <ul className="list-disc space-y-1 pl-5 text-sm">{(items ?? []).map((x, i) => <li key={i}>{x}</li>)}</ul>; }
function Field({ label, text }: { label: string; text?: string | undefined }) {
  if (!text) return null;
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="text-sm"><Markdown text={text} /></div></div>;
}
function Expand({ title, badge, children, open: initial = false }: { title: string; badge?: ReactNode; children: ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(initial);
  return (
    <div className="rounded-lg border bg-card">
      <button className="flex w-full items-center justify-between gap-2 p-3 text-left font-medium" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="flex flex-wrap items-center gap-2">{title}{badge}</span><ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="space-y-3 border-t p-4">{children}</div>}
    </div>
  );
}
function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-muted/60 text-left"><tr>{head.map((h) => <th key={h} className="p-2 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="divide-y">{rows.map((r, i) => <tr key={i} className="align-top">{r.map((cell, j) => <td key={j} className="p-2">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
const statusVariant = (s: string) => (s === "Required" || s === "Supported" ? "default" : s === "Conditional" ? "secondary" : "outline") as "default" | "secondary" | "outline";

function Section({ c, tab, onLabDone }: { c: Connector; tab: SectionKey; onLabDone: () => void }) {
  const k = c.content;
  switch (tab) {
    case "intro":
      return (
        <div className="space-y-4">
          <div className={box}><H>What is it?</H><Markdown text={k.overview?.what ?? ""} /></div>
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-5"><p className="mb-1 text-sm font-semibold">How Saviynt integrates with it</p><Markdown text={k.supportNote ?? c.support_type} /></div>
          <div className={box}><H>Why integrate with Saviynt?</H><Markdown text={k.overview?.why ?? ""} /><p className="mt-3 text-sm"><strong>Business problem: </strong>{k.overview?.problem}</p></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className={box}><p className="mb-2 font-semibold">Saviynt retrieves</p><List items={k.overview?.retrieves} /></div>
            <div className={box}><p className="mb-2 font-semibold">Saviynt sends</p><List items={k.overview?.sends} /></div>
            <div className={box}><p className="mb-2 font-semibold">Governance capabilities</p><List items={k.overview?.governance} /></div>
          </div>
          <div className={box}><p className="mb-2 font-semibold">Where it is used</p><Markdown text={k.overview?.whereUsed ?? ""} /><p className="mb-2 mt-4 font-semibold">Supported use cases</p><List items={k.useCases} /></div>
        </div>
      );
    case "architecture":
      return (
        <div className="space-y-4">
          <ConnectorDiagram title={c.name} nodes={k.architecture?.nodes ?? []} inbound={k.architecture?.inbound ?? []} outbound={k.architecture?.outbound ?? []} />
          <div className={box}><H>Components explained</H><Markdown text={k.architecture?.notes ?? ""} /></div>
        </div>
      );
    case "parameters":
      return (
        <div className={box}>
          <H>Connection parameters</H>
          <p className="mb-3 text-sm text-muted-foreground">Parameters relevant to {c.name}. Exact Saviynt field names vary by version — verify against official documentation. Example values are fictional.</p>
          <Table head={["Parameter", "Status", "Description", "Example", "Where to obtain", "Security", "Troubleshooting"]}
            rows={(k.parameters ?? []).map((p) => [<span className="font-mono text-xs font-semibold">{p.name}</span>, <Badge variant={statusVariant(p.status)}>{p.status}</Badge>, p.description, <code className="text-xs">{p.example}</code>, p.source, p.security, p.troubleshooting])} />
        </div>
      );
    case "security":
      return (
        <div className="space-y-4">
          <div className={box}><H>Supported authentication</H><List items={k.security?.auth} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={box}><p className="mb-2 font-semibold">Service account & least privilege</p><Markdown text={k.security?.serviceAccount ?? ""} /></div>
            <div className={box}><p className="mb-2 font-semibold">Network, TLS & firewall</p><Markdown text={k.security?.network ?? ""} /></div>
          </div>
          <div className={box}><p className="mb-2 font-semibold">Credential handling & rotation</p><Markdown text={k.security?.rotation ?? ""} /></div>
          <div className={box}>
            <H>Security permissions matrix</H>
            <p className="mb-3 text-sm text-muted-foreground">Permissions in the source/target system — distinct from Saviynt's own application roles.</p>
            <Table head={["Operation", "Required permission", "Purpose", "Security risk"]} rows={(k.permissions ?? []).map((p) => [<strong>{p.operation}</strong>, p.permission, p.purpose, p.risk])} />
          </div>
        </div>
      );
    case "endpoint":
      return (
        <div className="space-y-4">
          <div className={box}>
            <H>Application → Endpoint → Connection → Connector → System</H>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              {["Application", "Endpoint", "Connection", "Connector", c.name].map((x, i, a) => <span key={x} className="flex items-center gap-2"><span className="rounded-md border bg-muted px-3 py-1.5 font-medium">{x}</span>{i < a.length - 1 && <span className="text-muted-foreground">→</span>}</span>)}
            </div>
            <Markdown text={k.endpoint ?? ""} />
          </div>
        </div>
      );
    case "imports":
      return (
        <div className="space-y-3">
          <H>Import jobs</H>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">{(k.imports ?? []).map((j, i, a) => <span key={i} className="flex items-center gap-2"><span className="rounded-full bg-chart-2/15 px-3 py-1 font-medium">{i + 1}. {j.name}</span>{i < a.length - 1 && "→"}</span>)}</div>
          {(k.imports ?? []).map((j, i) => (
            <Expand key={i} title={j.name} open={i === 0}>
              <p className="text-sm">{j.purpose}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Input data" text={j.input} /><Field label="Execution sequence" text={j.sequence} /><Field label="Prerequisites" text={j.prerequisites} /><Field label="Data mapping" text={j.mapping} />
                <Field label="Correlation" text={j.correlation} /><Field label="Expected output" text={j.output} /><Field label="Validation" text={j.validation} /><Field label="Common errors & troubleshooting" text={j.errors} />
              </div>
            </Expand>
          ))}
        </div>
      );
    case "provisioning":
      return (
        <div className="space-y-3">
          <H>Provisioning operations</H>
          <p className="text-sm text-muted-foreground">Not every operation applies to every connector — support status is shown for each.</p>
          {(k.provisioning ?? []).map((p, i) => (
            <Expand key={i} title={p.operation} badge={<Badge variant={statusVariant(p.support)}>{p.support}</Badge>}>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Business use case" text={p.useCase} /><Field label="Workflow" text={p.workflow} /><Field label="Required permissions" text={p.permissions} /><Field label="Expected response" text={p.response} />
                <Field label="Validation" text={p.validation} /><Field label="Error handling" text={p.errorHandling} />
              </div>
              {p.example && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Illustrative example — verify for your version</p><pre className="mt-1 overflow-x-auto rounded-md bg-navy p-3 font-mono text-xs text-navy-foreground">{p.example}</pre></div>}
            </Expand>
          ))}
        </div>
      );
    case "scheduling":
      return (
        <div className="space-y-4">
          <div className={box}>
            <H>Example execution sequence</H>
            <ol className="space-y-2">{(k.scheduling?.sequence ?? []).map((s, i) => <li key={i} className="flex items-center gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</span><span className="text-sm">{s}</span></li>)}</ol>
          </div>
          <div className={box}><Markdown text={k.scheduling?.notes ?? ""} /></div>
        </div>
      );
    case "troubleshooting":
      return (
        <div className="space-y-3">
          <H>Troubleshooting scenarios</H>
          {(k.troubleshooting ?? []).map((t, i) => (
            <Expand key={i} title={`${i + 1}. ${t.error}`}>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Possible root cause" text={t.cause} /><Field label="Investigation" text={t.investigation} /><Field label="Resolution" text={t.resolution} /><Field label="Prevention" text={t.prevention} />
              </div>
              {t.validation && <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Validation commands / tests</p><pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded-md bg-navy p-3 font-mono text-xs text-navy-foreground">{t.validation}</pre></div>}
              <Field label="Interview discussion" text={t.interview} />
            </Expand>
          ))}
        </div>
      );
    case "scenarios":
      return (
        <div className="space-y-3">
          <H>Practical implementation scenarios</H>
          {(k.scenarios ?? []).map((s, i) => (
            <Expand key={i} title={s.title} open={i === 0}>
              {([["Business requirement", s.requirement], ["Architecture", s.architecture], ["Prerequisites", s.prerequisites], ["Configuration", s.configuration], ["Import", s.import], ["Correlation", s.correlation], ["Provisioning", s.provisioning], ["Testing", s.testing], ["Deployment", s.deployment], ["Support", s.support]] as const).map(([l, t], j) => (
                <div key={l} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{j + 1}</span><Field label={l} text={t} /></div>
              ))}
            </Expand>
          ))}
        </div>
      );
    case "lab":
      return <Lab c={c} onDone={onLabDone} />;
    case "interview":
      return <Interview c={c} />;
  }
}

function Lab({ c, onDone }: { c: Connector; onDone: () => void }) {
  const steps = c.content.lab ?? [];
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<Record<number, number>>({});
  const s = steps[i];
  if (!s) return null;
  const answered = pick[i] !== undefined;
  const correct = Object.entries(pick).filter(([k, v]) => steps[+k]?.answer === v).length;
  return (
    <div className={box}>
      <div className="mb-3 flex items-center justify-between gap-2"><H>{c.name} implementation lab</H><span className="text-xs text-muted-foreground">Step {i + 1} of {steps.length} · {correct} correct</span></div>
      <p className="mb-4 text-xs text-muted-foreground">Simulated exercise with fictional values. Nothing connects to real systems.</p>
      <Progress value={((i + (answered ? 1 : 0)) / steps.length) * 100} className="mb-4 h-1.5" />
      <h3 className="font-semibold">{s.title}</h3>
      <p className="mb-3 text-sm text-muted-foreground">{s.task}</p>
      <p className="mb-2 text-sm font-medium">{s.question}</p>
      <div className="space-y-2">
        {s.options.map((o, j) => {
          const state = !answered ? "" : j === s.answer ? "border-success bg-success/10" : pick[i] === j ? "border-destructive bg-destructive/10" : "opacity-60";
          return <button key={j} disabled={answered} onClick={() => setPick((p) => ({ ...p, [i]: j }))} className={`block w-full rounded-md border p-3 text-left text-sm ${state} ${!answered ? "hover:bg-muted" : ""}`}>{o}</button>;
        })}
      </div>
      {answered && (
        <div className="mt-4 space-y-2 rounded-md bg-muted/60 p-3 text-sm">
          <p><strong>Expected outcome: </strong>{s.expected}</p>
          <p><strong>Explanation: </strong>{s.explanation}</p>
        </div>
      )}
      <div className="mt-4 flex justify-between">
        <Button variant="outline" disabled={i === 0} onClick={() => setI(i - 1)}>Back</Button>
        {i < steps.length - 1 ? <Button disabled={!answered} onClick={() => setI(i + 1)}>Next step</Button> : <Button disabled={!answered} onClick={() => { onDone(); toast.success(`Lab complete — ${correct}/${steps.length} correct`); }}>Finish lab</Button>}
      </div>
    </div>
  );
}

function Interview({ c }: { c: Connector }) {
  const [level, setLevel] = useState("all");
  const qs = (c.content.interview ?? []).filter((q) => level === "all" || q.level === level);
  return (
    <div className="space-y-3">
      <H>Interview preparation</H>
      <div className="flex flex-wrap gap-1.5">
        {["all", ...INTERVIEW_LEVELS].map((l) => <button key={l} onClick={() => setLevel(l)} className={`rounded-full border px-3 py-1 text-xs ${level === l ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{l === "all" ? `All (${c.content.interview?.length ?? 0})` : l}</button>)}
      </div>
      {qs.map((q, i) => (
        <Expand key={`${level}-${i}`} title={q.q} badge={<Badge variant="outline">{q.level}</Badge>}><Markdown text={q.a} /></Expand>
      ))}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Bookmark, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CONNECTOR_CATEGORIES, connectorProgressPct, useConnectorProgress, useConnectors, type Connector } from "@/lib/connectors";

export const Route = createFileRoute("/_authenticated/connectors/")({
  head: () => ({
    meta: [
      { title: "Saviynt Connectors Learning Center — Sarath IGA Learning Portal" },
      { name: "description", content: "Architecture, parameters, security, import and provisioning jobs, troubleshooting and interview prep for every major Saviynt connector." },
      { property: "og:title", content: "Saviynt Connectors Learning Center" },
      { property: "og:description", content: "Deep technical guides for 33 Saviynt connectors and integrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConnectorsHome,
});

const sel = "h-9 rounded-md border bg-card px-3 text-sm";

function ConnectorsHome() {
  const { data: list = [], isLoading } = useConnectors();
  const { data: prog } = useConnectorProgress();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [onlySaved, setOnlySaved] = useState(false);
  const filtered = list.filter((c) =>
    (cat === "all" || c.category === cat) &&
    (!onlySaved || prog?.bookmarks.has(c.id)) &&
    `${c.name} ${c.summary} ${c.support_type}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      <PageHeader title="Connectors Learning Center" subtitle="Every major Saviynt EIC connector and integration — from first connectivity to production provisioning and support." />
      <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-muted-foreground">
        Guides separate official Saviynt capabilities, standard technology behaviour, general practice and illustrative examples. Items marked "verify" depend on your Saviynt version — always confirm against official Saviynt documentation. All hostnames and values are fictional.
      </div>
      <Tabs defaultValue="cards">
        <TabsList className="mb-4"><TabsTrigger value="cards">Connectors</TabsTrigger><TabsTrigger value="compare">Comparison matrix</TabsTrigger></TabsList>
        <TabsContent value="cards">
          <div className="mb-4 flex flex-wrap gap-2">
            <div className="relative min-w-56 flex-1"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Search connectors…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category">
              <option value="all">All categories</option>
              {CONNECTOR_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className={`${sel} flex items-center gap-1 ${onlySaved ? "border-primary text-primary" : ""}`} onClick={() => setOnlySaved((s) => !s)}><Bookmark className="h-4 w-4" />Bookmarked</button>
          </div>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {["all", ...CONNECTOR_CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-xs ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{c === "all" ? "All" : c}</button>
            ))}
          </div>
          {isLoading ? <p className="text-muted-foreground">Loading…</p> : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => <Card key={c.id} c={c} pct={connectorProgressPct(prog?.progress[c.id]?.sections_done)} saved={!!prog?.bookmarks.has(c.id)} />)}
              {!filtered.length && <p className="text-muted-foreground">No connectors match.</p>}
            </div>
          )}
        </TabsContent>
        <TabsContent value="compare"><Matrix list={list} /></TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ c, pct, saved }: { c: Connector; pct: number; saved: boolean }) {
  const ready = !!c.content?.overview;
  const nodes = c.content?.architecture?.nodes ?? [];
  return (
    <Link to="/connectors/$connectorId" params={{ connectorId: c.id }} className="group flex flex-col rounded-xl border bg-card p-5 shadow-card transition hover:border-primary">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div><p className="text-xs text-muted-foreground">{c.category}</p><h3 className="font-display text-lg font-semibold group-hover:text-primary">{c.name}</h3></div>
        {saved && <Bookmark className="h-4 w-4 fill-primary text-primary" />}
      </div>
      {nodes.length > 0 && (
        <div className="mb-3 flex items-center gap-1 overflow-hidden" aria-hidden>
          {nodes.slice(0, 6).map((n, i) => <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: n.zone === "source" ? "var(--chart-2)" : n.zone === "security" ? "var(--warning)" : n.zone === "target" ? "var(--chart-4)" : "var(--primary)" }} />)}
        </div>
      )}
      <p className="mb-3 flex-1 text-sm text-muted-foreground">{c.summary}</p>
      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge variant="secondary">{c.difficulty}</Badge>
        <Badge variant="outline" className="max-w-full truncate">{c.support_type.split("(")[0].trim()}</Badge>
        {!ready && <Badge variant="outline">Content being written</Badge>}
      </div>
      {(c.content?.useCases ?? []).length > 0 && <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">Use cases: {c.content.useCases!.slice(0, 3).join(" · ")}</p>}
      <div className="flex items-center gap-2"><Progress value={pct} className="h-1.5" /><span className="text-xs text-muted-foreground">{pct}%</span></div>
    </Link>
  );
}

type Col = "name" | "integrationType" | "auth" | "primaryData" | "importCap" | "provisioningCap" | "typicalUse" | "complexity";
const COLS: [Col, string][] = [["name", "Connector"], ["integrationType", "Integration type"], ["auth", "Authentication"], ["primaryData", "Primary data"], ["importCap", "Import"], ["provisioningCap", "Provisioning"], ["typicalUse", "Typical use case"], ["complexity", "Complexity"]];
const RANK: Record<string, number> = { Low: 1, Medium: 2, High: 3, "Very high": 4 };

function Matrix({ list }: { list: Connector[] }) {
  const [sort, setSort] = useState<{ col: Col; dir: 1 | -1 }>({ col: "name", dir: 1 });
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const val = (c: Connector, col: Col) => (col === "name" ? c.name : c.content?.compare?.[col] ?? "");
    return list
      .filter((c) => (cat === "all" || c.category === cat) && JSON.stringify([c.name, c.content?.compare]).toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => {
        const x = val(a, sort.col), y = val(b, sort.col);
        if (sort.col === "complexity") return ((RANK[x] ?? 9) - (RANK[y] ?? 9)) * sort.dir;
        return x.localeCompare(y) * sort.dir;
      });
  }, [list, sort, cat, q]);
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Filter rows…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category"><option value="all">All categories</option>{CONNECTOR_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">Capabilities marked "conditional" or "verify" depend on the Saviynt version and implementation.</p>
      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>{COLS.map(([k, l]) => (
              <th key={k} className="p-2 font-semibold"><button className="flex items-center gap-1" onClick={() => setSort((s) => ({ col: k, dir: s.col === k ? (s.dir === 1 ? -1 : 1) : 1 }))}>{l}<ArrowUpDown className="h-3 w-3" /></button></th>
            ))}</tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((c) => (
              <tr key={c.id} className="align-top">
                <td className="p-2 font-medium"><Link to="/connectors/$connectorId" params={{ connectorId: c.id }} className="text-primary hover:underline">{c.name}</Link></td>
                {COLS.slice(1).map(([k]) => <td key={k} className="p-2 text-muted-foreground">{c.content?.compare?.[k as Exclude<Col, "name">] ?? "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

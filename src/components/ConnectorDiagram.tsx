import { useRef, useState } from "react";
import { ZoomIn, ZoomOut, Download, ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ArchNode } from "@/lib/connectors";

const ZONES: Record<ArchNode["zone"], { label: string; fill: string; stroke: string }> = {
  source: { label: "Source / authoritative system", fill: "var(--chart-2)", stroke: "var(--chart-2)" },
  security: { label: "Authentication & network boundary", fill: "var(--warning)", stroke: "var(--warning)" },
  saviynt: { label: "Saviynt EIC", fill: "var(--primary)", stroke: "var(--primary)" },
  target: { label: "Target application", fill: "var(--chart-4)", stroke: "var(--chart-4)" },
};

const W = 520, NODE_H = 46, GAP = 22, X = 110, NW = 300;

/** Interactive SVG architecture: zones as security boundaries, click nodes for detail, zoom, download. */
export function ConnectorDiagram({ title, nodes, inbound, outbound }: { title: string; nodes: ArchNode[]; inbound: string[]; outbound: string[] }) {
  const [zoom, setZoom] = useState(1);
  const [active, setActive] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const H = nodes.length * (NODE_H + GAP) + 30;

  // group consecutive nodes by zone to draw boundaries
  const groups: { zone: ArchNode["zone"]; start: number; end: number }[] = [];
  nodes.forEach((n, i) => {
    const z = ZONES[n.zone] ? n.zone : "saviynt";
    const last = groups[groups.length - 1];
    if (last && last.zone === z) last.end = i;
    else groups.push({ zone: z, start: i, end: i });
  });
  const y = (i: number) => 15 + i * (NODE_H + GAP);

  function download() {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    const cs = getComputedStyle(document.documentElement);
    const html = clone.outerHTML.replace(/var\((--[\w-]+)\)/g, (_, v: string) => cs.getPropertyValue(v).trim() || "#888");
    const url = URL.createObjectURL(new Blob([html], { type: "image/svg+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\W+/g, "-").toLowerCase()}-architecture.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const info = active !== null ? nodes[active] : null;
  return (
    <figure className="overflow-hidden rounded-xl border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2">
        <figcaption className="text-sm font-semibold">{title} — architecture</figcaption>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
          <span className="w-10 text-center font-mono text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setZoom((z) => Math.min(2, z + 0.2))} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={download} aria-label="Download diagram"><Download className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[1fr_260px]">
        <div className="overflow-auto">
          <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} style={{ width: `${zoom * 100}%`, maxWidth: zoom * W * 1.4, minWidth: 320 }} role="img" aria-label={`${title} architecture diagram`} fontFamily="IBM Plex Sans, sans-serif">
            <defs>
              <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted-foreground)" /></marker>
            </defs>
            {groups.map((g, i) => (
              <g key={i}>
                <rect x={X - 18} y={y(g.start) - 9} width={NW + 36} height={y(g.end) - y(g.start) + NODE_H + 18} rx={12} fill={ZONES[g.zone].fill} fillOpacity={0.07} stroke={ZONES[g.zone].stroke} strokeDasharray="5 4" strokeOpacity={0.6} />
                <text x={X - 24} y={y(g.start) + 6} textAnchor="end" fontSize={9} fill="var(--muted-foreground)">{ZONES[g.zone].label.split(" ")[0]}</text>
              </g>
            ))}
            {/* inbound (import) arrow on left, outbound (provisioning) on right */}
            <line x1={40} y1={H - 20} x2={40} y2={20} stroke="var(--chart-2)" strokeWidth={2} markerEnd="url(#arr)" />
            <text x={30} y={H / 2} fontSize={10} fill="var(--chart-2)" transform={`rotate(-90 30 ${H / 2})`} textAnchor="middle">Inbound: import & reconciliation</text>
            <line x1={W - 40} y1={20} x2={W - 40} y2={H - 20} stroke="var(--chart-4)" strokeWidth={2} markerEnd="url(#arr)" />
            <text x={W - 26} y={H / 2} fontSize={10} fill="var(--chart-4)" transform={`rotate(90 ${W - 26} ${H / 2})`} textAnchor="middle">Outbound: provisioning</text>
            {nodes.map((n, i) => {
              const z = ZONES[n.zone] ?? ZONES.saviynt;
              return (
                <g key={i} onClick={() => setActive(i)} style={{ cursor: "pointer" }} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setActive(i)}>
                  <title>{n.detail}</title>
                  {i < nodes.length - 1 && <line x1={X + NW / 2} y1={y(i) + NODE_H} x2={X + NW / 2} y2={y(i + 1) - 2} stroke="var(--muted-foreground)" strokeWidth={1.5} markerEnd="url(#arr)" />}
                  <rect x={X} y={y(i)} width={NW} height={NODE_H} rx={9} fill="var(--card)" stroke={z.stroke} strokeWidth={active === i ? 3 : 1.5} />
                  <rect x={X} y={y(i)} width={6} height={NODE_H} rx={3} fill={z.fill} />
                  <text x={X + NW / 2} y={y(i) + NODE_H / 2 + 4} textAnchor="middle" fontSize={12.5} fontWeight={600} fill="var(--foreground)">{n.label.length > 42 ? n.label.slice(0, 40) + "…" : n.label}</text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.values(ZONES).map((z) => <span key={z.label} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: z.fill }} />{z.label}</span>)}
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 font-semibold"><ArrowDown className="h-4 w-4 text-chart-2" />Inbound flow</p>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">{inbound.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1 font-semibold"><ArrowUp className="h-4 w-4 text-chart-4" />Outbound flow</p>
            <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">{outbound.map((s, i) => <li key={i}>{s}</li>)}</ol>
          </div>
        </div>
      </div>
      <div className="min-h-16 border-t bg-accent/40 px-4 py-3 text-sm">
        {info ? <><p className="font-semibold">{info.label}</p><p className="text-muted-foreground">{info.detail}</p></> : <p className="text-muted-foreground">Click any component to expand its explanation.</p>}
      </div>
    </figure>
  );
}

import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i}>{p.slice(1, -1)}</code>;
    return <Fragment key={i}>{p}</Fragment>;
  });
}

/** Minimal safe markdown renderer (no HTML injection). */
export function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? "").startsWith("```")) buf.push(lines[i++] ?? "");
      i++;
      out.push(<pre key={out.length}><code>{buf.join("\n")}</code></pre>);
      continue;
    }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test((lines[i] ?? ""))) items.push((lines[i++] ?? "").replace(/^\s*[-*]\s+/, ""));
      out.push(<ul key={out.length}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test((lines[i] ?? ""))) items.push((lines[i++] ?? "").replace(/^\s*\d+\.\s+/, ""));
      out.push(<ol key={out.length}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ol>);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i] ?? "")) {
        const r = (lines[i++] ?? "").trim().slice(1, -1).split("|").map((c) => c.trim());
        if (!r.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(r);
      }
      const [head, ...body] = rows;
      out.push(
        <table key={out.length}>
          {head && <thead><tr>{head.map((c, k) => <th key={k}>{inline(c)}</th>)}</tr></thead>}
          <tbody>{body.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}>{inline(c)}</td>)}</tr>)}</tbody>
        </table>,
      );
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) {
      const lvl = (h[1] ?? "").length;
      const ht = h[2] ?? "";
      out.push(lvl <= 2 ? <h2 key={out.length}>{inline(ht)}</h2> : <h3 key={out.length}>{inline(ht)}</h3>);
    } else if (line.trim()) {
      out.push(<p key={out.length}>{inline(line)}</p>);
    }
    i++;
  }
  return <div className="prose-ai text-sm">{out}</div>;
}

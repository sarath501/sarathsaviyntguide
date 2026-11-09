import { Fragment, useState } from "react";
import { Check, Copy } from "lucide-react";

const SQL_KW = /\b(SELECT|FROM|WHERE|AND|OR|NOT|IN|IS|NULL|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|ON|GROUP|BY|ORDER|HAVING|AS|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|LIKE|BETWEEN|EXISTS|UNION|ALL|LIMIT|DESC|ASC|WITH|INSERT|UPDATE|DELETE|INTO|VALUES|SET|CREATE|TABLE)\b/gi;

function highlight(code: string, lang: string) {
  const tokens: { t: string; c?: string }[] = [];
  const re = lang === "sql"
    ? /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+|.)/g
    : /("(?:[^"\\]|\\.)*"(?=\s*:))|("(?:[^"\\]|\\.)*")|(\b-?\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)|(\/\/[^\n]*|#[^\n]*)|(\s+|.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    if (lang === "sql") {
      if (m[1]) tokens.push({ t: m[1], c: "text-navy-muted italic" });
      else if (m[2]) tokens.push({ t: m[2], c: "text-chart-4" });
      else if (m[3]) tokens.push({ t: m[3], c: "text-chart-2" });
      else if (m[4]) tokens.push(SQL_KW.test(m[4]) ? { t: m[4], c: "font-semibold text-chart-2" } : { t: m[4] });
      else tokens.push({ t: m[0] });
      SQL_KW.lastIndex = 0;
    } else {
      if (m[1]) tokens.push({ t: m[1], c: "text-chart-2" });
      else if (m[2]) tokens.push({ t: m[2], c: "text-chart-4" });
      else if (m[3]) tokens.push({ t: m[3], c: "text-chart-3" });
      else if (m[4]) tokens.push({ t: m[4], c: "text-navy-muted italic" });
      else tokens.push({ t: m[0] });
    }
  }
  return tokens.map((x, i) => (x.c ? <span key={i} className={x.c}>{x.t}</span> : <Fragment key={i}>{x.t}</Fragment>));
}

export function CodeBlock({ code, language = "text", title }: { code: string; language?: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = language.toLowerCase();
  return (
    <div className="overflow-hidden rounded-lg border border-navy-line bg-navy">
      <div className="flex items-center justify-between border-b border-navy-line px-3 py-1.5">
        <span className="font-mono text-xs text-navy-muted">{title ? `${title} · ` : ""}{lang.toUpperCase()}</span>
        <button className="text-navy-muted hover:text-navy-foreground" aria-label="Copy code" onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-navy-foreground"><code>{lang === "sql" || lang === "json" ? highlight(code, lang) : code}</code></pre>
    </div>
  );
}

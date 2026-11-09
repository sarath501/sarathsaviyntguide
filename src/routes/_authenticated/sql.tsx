import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Play, CheckCircle2, XCircle, Bot, Lightbulb, Eye } from "lucide-react";
import type { Database } from "sql.js";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/Markdown";
import { tutorChat } from "@/lib/ai.functions";
import { EXERCISES, SCHEMA_DOC, SCHEMA_SQL, sameResult } from "@/lib/sql-lab";

export const Route = createFileRoute("/_authenticated/sql")({
  head: () => ({ meta: [{ title: "SQL Practice — IGA Academy AI" }] }),
  component: SqlLab,
});

type Result = { columns: string[]; values: unknown[][] };
const SOLVED_KEY = "iga-sql-solved";

function SqlLab() {
  const dbRef = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [exId, setExId] = useState(EXERCISES[0]!.id);
  const ex = EXERCISES.find((e) => e.id === exId)!;
  const [query, setQuery] = useState("SELECT * FROM users;");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [solved, setSolved] = useState<string[]>([]);
  const ask = useServerFn(tutorChat);

  useEffect(() => {
    setSolved(JSON.parse(localStorage.getItem(SOLVED_KEY) ?? "[]"));
    let cancelled = false;
    (async () => {
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/sql.js@1.15.2/dist/${f}` });
      if (cancelled) return;
      const db = new SQL.Database();
      db.run(SCHEMA_SQL);
      dbRef.current = db;
      setReady(true);
    })().catch((e) => toast.error("Could not load the SQL engine: " + (e as Error).message));
    return () => { cancelled = true; dbRef.current?.close(); };
  }, []);

  function exec(sql: string): Result {
    const r = dbRef.current!.exec(sql);
    const last = r[r.length - 1];
    return last ? { columns: last.columns, values: last.values } : { columns: [], values: [] };
  }

  function run() {
    if (!dbRef.current) return;
    setFeedback("");
    if (/\b(insert|update|delete|drop|alter|create|attach|pragma)\b/i.test(query)) {
      setError("Only SELECT queries are allowed in practice mode.");
      setResult(null); setVerdict(null);
      return;
    }
    try {
      const r = exec(query);
      setResult(r); setError(null);
      const ok = sameResult(r.values, exec(ex.solution).values);
      setVerdict(ok);
      if (ok && !solved.includes(ex.id)) {
        const next = [...solved, ex.id];
        setSolved(next);
        localStorage.setItem(SOLVED_KEY, JSON.stringify(next));
      }
    } catch (e) {
      setError((e as Error).message); setResult(null); setVerdict(null);
    }
  }

  async function aiReview() {
    setBusy(true);
    try {
      const r = await ask({ data: { mode: "a concise SQL coach review: is it correct, why or why not, how to improve readability/performance, and a short Saviynt real-world note. Do not just paste the full solution unless the query is badly wrong", messages: [{ role: "user", content: `Schema (simplified Saviynt EIC):\n${SCHEMA_DOC.map((s) => `${s.table}(${s.cols})`).join("\n")}\n\nTask: ${ex.task}\n\nMy query:\n${query}\n\nResult: ${error ? "ERROR " + error : verdict ? "matches expected output" : `does not match expected output (${result?.values.length ?? 0} rows)`}\n\nReference solution (for your grading only): ${ex.solution}` }] } });
      setFeedback(r.text);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function pick(id: string) {
    setExId(id); setVerdict(null); setResult(null); setError(null); setShowHint(false); setShowSol(false); setFeedback("");
  }

  return (
    <div>
      <PageHeader title="SQL Practice Lab" subtitle={`Write queries against sample Saviynt-style data. ${solved.length}/${EXERCISES.length} solved.`} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="space-y-1">
            {EXERCISES.map((e) => (
              <button key={e.id} onClick={() => pick(e.id)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${e.id === exId ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
                {solved.includes(e.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <span className="h-4 w-4 shrink-0 rounded-full border" />}
                <span className="flex-1">{e.title}</span>
              </button>
            ))}
          </div>
          <div className="rounded-xl border bg-card p-4 text-xs shadow-card">
            <p className="mb-2 font-semibold">Tables</p>
            {SCHEMA_DOC.map((s) => (
              <div key={s.table} className="mb-2"><button className="font-mono text-primary hover:underline" onClick={() => setQuery(`SELECT * FROM ${s.table};`)}>{s.table}</button><p className="text-muted-foreground">{s.cols}</p></div>
            ))}
          </div>
        </aside>
        <div className="min-w-0 space-y-4">
          <div className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-2"><h2 className="font-semibold">{ex.title}</h2><Badge variant="secondary">{ex.level}</Badge></div>
            <p className="mt-2 text-sm">{ex.task}</p>
            {showHint && <p className="mt-2 text-sm text-muted-foreground">💡 {ex.hint}</p>}
            {showSol && <pre className="mt-3 overflow-x-auto rounded-md bg-navy p-3 font-mono text-xs text-navy-foreground">{ex.solution}</pre>}
          </div>
          <Textarea value={query} onChange={(e) => setQuery(e.target.value)} rows={7} spellCheck={false} className="font-mono text-sm" onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run(); }} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={run} disabled={!ready}><Play className="mr-1 h-4 w-4" />{ready ? "Run & check" : "Loading engine…"}</Button>
            <Button variant="secondary" onClick={aiReview} disabled={busy || !ready}><Bot className="mr-1 h-4 w-4" />{busy ? "Reviewing…" : "AI feedback"}</Button>
            <Button variant="ghost" onClick={() => setShowHint(true)}><Lightbulb className="mr-1 h-4 w-4" />Hint</Button>
            <Button variant="ghost" onClick={() => setShowSol(true)}><Eye className="mr-1 h-4 w-4" />Solution</Button>
            <span className="self-center text-xs text-muted-foreground">Ctrl/⌘ + Enter to run</span>
          </div>
          {verdict !== null && (
            <div className={`flex items-center gap-2 rounded-md border p-3 text-sm ${verdict ? "border-success bg-accent" : "border-destructive"}`}>
              {verdict ? <><CheckCircle2 className="h-4 w-4 text-success" /> Correct — your output matches the expected result.</> : <><XCircle className="h-4 w-4 text-destructive" /> Not quite — the output differs from the expected result. Try a hint or ask for AI feedback.</>}
            </div>
          )}
          {error && <p className="rounded-md border border-destructive p-3 font-mono text-xs text-destructive">{error}</p>}
          {result && (
            <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-muted"><tr>{result.columns.map((c) => <th key={c} className="px-3 py-2 text-left font-mono text-xs">{c}</th>)}</tr></thead>
                <tbody>{result.values.map((r, i) => <tr key={i} className="border-t">{r.map((v, j) => <td key={j} className="px-3 py-1.5 font-mono text-xs">{v === null ? <span className="text-muted-foreground">NULL</span> : String(v)}</td>)}</tr>)}</tbody>
              </table>
              <p className="border-t px-3 py-2 text-xs text-muted-foreground">{result.values.length} row(s)</p>
            </div>
          )}
          {feedback && <div className="rounded-xl border bg-card p-5 shadow-card"><Markdown text={feedback} /></div>}
        </div>
      </div>
    </div>
  );
}

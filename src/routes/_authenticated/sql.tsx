import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Database } from "sql.js";
import { toast } from "sonner";
import {
  Bookmark, BookmarkCheck, CheckCircle2, Clipboard, Eye, History,
  Lightbulb, Play, RotateCcw, Save, Search, Table2, XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EXERCISES, SCHEMA_DOC, SCHEMA_SQL, sameResult } from "@/lib/sql-lab";
import { readStoredQueries, readStoredStringArray, validateReadOnlySql } from "@/lib/sql-lab-progress";

export const Route = createFileRoute("/_authenticated/sql")({
  head: () => ({ meta: [{ title: "Saviynt SQL Learning Center — Sarath IGA Learning Portal" }] }),
  component: SqlLab,
});

type Result = { columns: string[]; values: unknown[][] };
type SavedQuery = { name: string; sql: string; savedAt: string };
const SOLVED_KEY = "iga-sql-solved";
const BOOKMARK_KEY = "iga-sql-bookmarks";
const HISTORY_KEY = "iga-sql-history";
const SAVED_KEY = "iga-sql-saved-queries";
const CATEGORIES: Record<string, string> = {
  e1: "Filtering & basics",
  e2: "Joins & aggregation",
  e3: "Joins & data quality",
  e4: "Identity lifecycle",
  e5: "Entitlement governance",
  e6: "Segregation of duties",
  e7: "Account hygiene",
};

function SqlLab() {
  const dbRef = useRef<Database | null>(null);
  const [ready, setReady] = useState(false);
  const [exId, setExId] = useState(EXERCISES[0]!.id);
  const [query, setQuery] = useState(EXERCISES[0]!.solution);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showSol, setShowSol] = useState(false);
  const [busy, setBusy] = useState(false);
  const [solved, setSolved] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("All levels");
  const [category, setCategory] = useState("All categories");
  const [showSchema, setShowSchema] = useState(false);

  const ex = EXERCISES.find((item) => item.id === exId) ?? EXERCISES[0]!;
  const filteredExercises = useMemo(() => EXERCISES.filter((item) => {
    const matchesSearch = `${item.title} ${item.task} ${CATEGORIES[item.id]}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (level === "All levels" || item.level === level) &&
      (category === "All categories" || CATEGORIES[item.id] === category);
  }), [search, level, category]);
  const categories = [...new Set(Object.values(CATEGORIES))];

  useEffect(() => {
    setSolved(readStoredStringArray(SOLVED_KEY));
    setBookmarks(readStoredStringArray(BOOKMARK_KEY));
    setHistory(readStoredStringArray(HISTORY_KEY));
    setSavedQueries(readStoredQueries(SAVED_KEY));
    let cancelled = false;
    (async () => {
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.15.2/dist/${file}` });
      if (cancelled) return;
      const db = new SQL.Database();
      db.run(SCHEMA_SQL);
      dbRef.current = db;
      setReady(true);
    })().catch((cause) => toast.error("Could not load the SQL engine: " + (cause as Error).message));
    return () => { cancelled = true; dbRef.current?.close(); };
  }, []);

  function exec(sql: string): Result {
    const statements = dbRef.current!.exec(sql);
    const last = statements[statements.length - 1];
    return last ? { columns: last.columns, values: last.values } : { columns: [], values: [] };
  }

  function run() {
    if (!dbRef.current) return;
    setError(null);
    setResult(null);
    setVerdict(null);
    const validationError = validateReadOnlySql(query);
    if (validationError) { setError(validationError); return; }
    try {
      const output = exec(query);
      setResult(output);
      const correct = sameResult(output.values, exec(ex.solution).values);
      setVerdict(correct);
      const nextHistory = [query.trim(), ...history.filter((item) => item !== query.trim())].slice(0, 10);
      setHistory(nextHistory);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
      if (correct && !solved.includes(ex.id)) {
        const nextSolved = [...solved, ex.id];
        setSolved(nextSolved);
        localStorage.setItem(SOLVED_KEY, JSON.stringify(nextSolved));
        toast.success("Exercise completed!");
      }
    } catch (cause) {
      setError((cause as Error).message);
    }
  }

  function pick(id: string) {
    const selected = EXERCISES.find((item) => item.id === id);
    if (!selected) return;
    setExId(id);
    setQuery(selected.solution);
    setVerdict(null); setResult(null); setError(null); setShowHint(false); setShowSol(false);
  }

  function toggleBookmark(id: string) {
    const next = bookmarks.includes(id) ? bookmarks.filter((item) => item !== id) : [...bookmarks, id];
    setBookmarks(next);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
  }

  function saveQuery() {
    const name = `Saved query ${savedQueries.length + 1}`;
    const next = [{ name, sql: query, savedAt: new Date().toISOString() }, ...savedQueries].slice(0, 25);
    setSavedQueries(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    toast.success("Query saved in this browser.");
  }

  async function copyQuery(value = query) {
    try { await navigator.clipboard.writeText(value); toast.success("Copied to clipboard."); }
    catch { toast.error("Clipboard access is unavailable in this browser."); }
  }

  function resetDataset() {
    if (!dbRef.current) return;
    try {
      dbRef.current.close();
      // Recreate only the in-memory sample database; learner progress remains untouched.
      import("sql.js").then(async (module) => {
        const initSqlJs = module.default;
        const SQL = await initSqlJs({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/sql.js@1.15.2/dist/${file}` });
        const db = new SQL.Database();
        db.run(SCHEMA_SQL);
        dbRef.current = db;
        setResult(null); setError(null); setVerdict(null);
        toast.success("Sample dataset reset. Your saved progress was preserved.");
      }).catch((cause) => toast.error((cause as Error).message));
    } catch (cause) { toast.error((cause as Error).message); }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saviynt SQL Learning Center"
        subtitle={`Practice with a fictional Saviynt-style dataset · ${solved.length}/${EXERCISES.length} exercises completed`}
        action={<Badge variant="secondary">Browser practice database</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Exercises completed</p><p className="mt-1 text-2xl font-semibold">{solved.length}<span className="text-sm text-muted-foreground"> / {EXERCISES.length}</span></p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Bookmarked exercises</p><p className="mt-1 text-2xl font-semibold">{bookmarks.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">Recent queries</p><p className="mt-1 text-2xl font-semibold">{history.length}<span className="text-sm text-muted-foreground"> / 10</span></p></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-xl border bg-card p-4 shadow-card">
            <h2 className="mb-3 font-semibold">Exercise library</h2>
            <div className="relative mb-3"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input aria-label="Search exercises" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search exercises…" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm" /></div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select aria-label="Filter by difficulty" value={level} onChange={(event) => setLevel(event.target.value)} className="h-9 min-w-0 rounded-md border bg-background px-2 text-xs"><option>All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
              <select aria-label="Filter by category" value={category} onChange={(event) => setCategory(event.target.value)} className="h-9 min-w-0 rounded-md border bg-background px-2 text-xs"><option>All categories</option>{categories.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
            <div className="space-y-1">
              {filteredExercises.map((item) => (
                <button key={item.id} onClick={() => pick(item.id)} className={`flex w-full items-start gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${item.id === exId ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
                  {solved.includes(item.id) ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <span className="mt-0.5 h-4 w-4 shrink-0 rounded-full border" />}
                  <span className="min-w-0 flex-1"><span className="block font-medium">{item.title}</span><span className="block text-[11px] text-muted-foreground">{CATEGORIES[item.id]} · {item.level}</span></span>
                  {bookmarks.includes(item.id) && <BookmarkCheck className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              ))}
              {!filteredExercises.length && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">No exercises match these filters.</p>}
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4 shadow-card">
            <button className="flex w-full items-center justify-between text-left font-semibold" onClick={() => setShowSchema((value) => !value)}><span className="flex items-center gap-2"><Table2 className="h-4 w-4" /> Sample schema explorer</span><span className="text-xs text-primary">{showSchema ? "Hide" : "Show tables"}</span></button>
            {showSchema && <div className="mt-3 space-y-3">{SCHEMA_DOC.map((table) => <div key={table.table} className="border-t pt-2"><button className="font-mono text-sm font-semibold text-primary hover:underline" onClick={() => setQuery(`SELECT * FROM ${table.table};`)}>{table.table}</button><p className="mt-1 text-xs leading-5 text-muted-foreground">{table.cols}</p></div>)}</div>}
          </section>

          {history.length > 0 && <section className="rounded-xl border bg-card p-4 shadow-card"><h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4" /> Recent queries</h2>{history.slice(0, 5).map((item, index) => <button key={index} onClick={() => setQuery(item)} className="mb-1 block w-full truncate rounded px-2 py-1.5 text-left font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground">{item}</button>)}</section>}
          {savedQueries.length > 0 && <section className="rounded-xl border bg-card p-4 shadow-card"><h2 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Save className="h-4 w-4" /> Saved queries</h2>{savedQueries.map((item, index) => <button key={`${item.savedAt}-${index}`} onClick={() => setQuery(item.sql)} className="mb-1 block w-full truncate rounded px-2 py-1.5 text-left text-xs hover:bg-muted">{item.name}</button>)}</section>}
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{ex.title}</h2><Badge variant="secondary">{ex.level}</Badge><Badge variant="outline">{CATEGORIES[ex.id]}</Badge></div><p className="mt-2 text-sm leading-6">{ex.task}</p></div>
              <Button variant="ghost" size="icon" aria-label={bookmarks.includes(ex.id) ? "Remove bookmark" : "Bookmark exercise"} onClick={() => toggleBookmark(ex.id)}>{bookmarks.includes(ex.id) ? <BookmarkCheck className="h-5 w-5 text-primary" /> : <Bookmark className="h-5 w-5" />}</Button>
            </div>
            {showHint && <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">Hint: {ex.hint}</p>}
            {showSol && <div className="mt-3 space-y-2"><p className="text-xs font-semibold text-muted-foreground">Reference solution</p><pre className="overflow-x-auto rounded-md bg-navy p-3 font-mono text-xs text-navy-foreground">{ex.solution}</pre><Button size="sm" variant="outline" onClick={() => setQuery(ex.solution)}>Load solution into editor</Button></div>}
          </section>

          <section className="overflow-hidden rounded-xl border bg-card shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3"><div><h2 className="text-sm font-semibold">SQL editor</h2><p className="text-xs text-muted-foreground">Read-only SELECT queries · Ctrl/⌘ + Enter to run</p></div><Badge variant="outline">{ready ? "Engine ready" : "Loading engine…"}</Badge></div>
            <Textarea aria-label="SQL query editor" value={query} onChange={(event) => setQuery(event.target.value)} rows={12} spellCheck={false} className="min-h-[260px] resize-y rounded-none border-0 font-mono text-sm leading-6 focus-visible:ring-0" onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") { event.preventDefault(); run(); } }} />
            <div className="flex flex-wrap items-center gap-2 border-t p-3">
              <Button onClick={run} disabled={!ready}><Play className="mr-1 h-4 w-4" />Run & check</Button>
              <Button variant="outline" onClick={() => setShowHint((value) => !value)}><Lightbulb className="mr-1 h-4 w-4" />{showHint ? "Hide hint" : "Hint"}</Button>
              <Button variant="outline" onClick={() => setShowSol((value) => !value)}><Eye className="mr-1 h-4 w-4" />{showSol ? "Hide solution" : "Solution"}</Button>
              <Button variant="ghost" onClick={() => void copyQuery()}><Clipboard className="mr-1 h-4 w-4" />Copy</Button>
              <Button variant="ghost" onClick={saveQuery}><Save className="mr-1 h-4 w-4" />Save query</Button>
              <Button variant="ghost" onClick={() => setQuery("SELECT * FROM users;")}><RotateCcw className="mr-1 h-4 w-4" />Reset editor</Button>
            </div>
          </section>

          {verdict !== null && <div className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${verdict ? "border-success bg-accent" : "border-destructive"}`}>{verdict ? <><CheckCircle2 className="h-4 w-4 text-success" />Correct — your result matches the expected exercise output.</> : <><XCircle className="h-4 w-4 text-destructive" />Not quite. Compare your filters, joins and selected columns, then try again.</>}</div>}
          {error && <p role="alert" className="rounded-lg border border-destructive p-3 font-mono text-xs text-destructive">{error}</p>}
          {result && <section className="overflow-hidden rounded-xl border bg-card shadow-card"><div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3"><h2 className="text-sm font-semibold">Query results</h2><Badge variant="secondary">{result.values.length} row(s)</Badge></div><div className="max-h-[480px] overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-muted"><tr>{result.columns.map((column, index) => <th key={`${column}-${index}`} className="whitespace-nowrap px-3 py-2 text-left font-mono text-xs">{column}</th>)}</tr></thead><tbody>{result.values.map((row, index) => <tr key={index} className="border-t">{row.map((value, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2 font-mono text-xs">{value === null ? <span className="text-muted-foreground">NULL</span> : String(value)}</td>)}</tr>)}</tbody></table></div></section>}
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4"><div><p className="text-sm font-semibold">Practice dataset controls</p><p className="text-xs text-muted-foreground">Reset the fictional in-memory dataset without clearing your exercise progress or saved queries.</p></div><Button variant="outline" size="sm" onClick={resetDataset} disabled={!ready}><RotateCcw className="mr-2 h-4 w-4" />Reset sample data</Button></section>
          <p className="text-xs leading-5 text-muted-foreground">Training environment only: this page runs SQLite in your browser against fictional sample records. It is not connected to a Saviynt tenant or the portal's production database. Progress, bookmarks, query history and saved queries are stored in this browser and are not synchronized across devices. No AI calls or external database credentials are used.</p>
        </main>
      </div>
    </div>
  );
}

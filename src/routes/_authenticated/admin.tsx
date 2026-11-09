import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Plus, Sparkles as Wand, Upload, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/use-auth";
import { useCurriculum, type LessonContent } from "@/lib/curriculum";
import { DIAGRAMS } from "@/lib/diagrams";
import { generateLessonContent } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Sarath IGA Learning Portal" }] }),
  component: Admin,
});

const sel = "h-9 w-full rounded-md border bg-card px-3 text-sm";
const card = "rounded-xl border bg-card p-6 shadow-card";
const err = (e: { message: string } | null) => { if (e) { toast.error(e.message); return true; } return false; };

function Admin() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return <p>Loading…</p>;
  if (!isAdmin) return <p className="text-muted-foreground">You don't have access to this page.</p>;
  return (
    <div>
      <PageHeader title="Administrator dashboard" subtitle="Platform usage and learning content management." />
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="labs">Labs</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="modules"><Modules /></TabsContent>
        <TabsContent value="lessons"><Lessons /></TabsContent>
        <TabsContent value="questions"><Questions /></TabsContent>
        <TabsContent value="labs"><Labs /></TabsContent>
      </Tabs>
    </div>
  );
}

function Overview() {
  const { data: d } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [u, a, i] = await Promise.all([
        supabase.from("profiles").select("id,full_name,experience_level,created_at").order("created_at", { ascending: false }),
        supabase.from("quiz_attempts").select("score,total"),
        supabase.from("interviews").select("id", { count: "exact", head: true }),
      ]);
      return { users: u.data ?? [], attempts: a.data ?? [], interviews: i.count ?? 0 };
    },
  });
  const avg = d?.attempts.length ? Math.round(d.attempts.reduce((s, x) => s + (x.score / x.total) * 100, 0) / d.attempts.length) : 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[["Users", d?.users.length ?? 0], ["Quiz attempts", d?.attempts.length ?? 0], ["Avg quiz score", `${avg}%`], ["Interviews", d?.interviews ?? 0]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border bg-card p-4 shadow-card"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-semibold">{v}</p></div>
        ))}
      </div>
      <div className={card}>
        <h2 className="mb-3 font-semibold">Users</h2>
        <ul className="divide-y">{d?.users.map((u) => (
          <li key={u.id} className="flex justify-between gap-2 py-2 text-sm"><span>{u.full_name || "—"}</span><span className="text-muted-foreground">{u.experience_level}</span><span className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span></li>
        ))}</ul>
      </div>
    </div>
  );
}

function Modules() {
  const qc = useQueryClient();
  const { data: cur } = useCurriculum();
  const [f, setF] = useState({ id: "", title: "", level: "Beginner", summary: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["curriculum"] });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const num = (cur?.modules.reduce((m, x) => Math.max(m, x.num), 0) ?? 0) + 1;
    if (err((await supabase.from("modules").insert({ ...f, id: f.id || `m${num}`, num })).error)) return;
    setF({ id: "", title: "", level: "Beginner", summary: "" });
    toast.success("Module added");
    refresh();
  }
  async function update(id: string, patch: Record<string, unknown>) {
    if (!err((await supabase.from("modules").update(patch).eq("id", id)).error)) refresh();
  }
  async function del(id: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    if (!err((await supabase.from("modules").delete().eq("id", id)).error)) refresh();
  }
  return (
    <div className="space-y-6">
      <form onSubmit={add} className={`${card} grid gap-3 md:grid-cols-2`}>
        <h2 className="font-semibold md:col-span-2">Add module</h2>
        <Input required placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <select className={sel} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{["Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}</select>
        <Textarea className="md:col-span-2" placeholder="Summary" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
        <Button type="submit" className="w-fit"><Plus className="mr-1 h-4 w-4" />Add module</Button>
      </form>
      <div className={card}>
        <h2 className="mb-3 font-semibold">Modules</h2>
        <ul className="divide-y">{cur?.modules.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">M{m.num}</span>
            <Input className="h-8 max-w-sm flex-1" defaultValue={m.title} onBlur={(e) => e.target.value !== m.title && update(m.id, { title: e.target.value })} />
            <span className="text-xs text-muted-foreground">{m.lessons.length} lessons</span>
            <Button size="sm" variant="ghost" onClick={() => update(m.id, { published: !m.published })}>{m.published ? <><Eye className="mr-1 h-4 w-4" />Published</> : <><EyeOff className="mr-1 h-4 w-4" />Hidden</>}</Button>
            <Button size="icon" variant="ghost" onClick={() => del(m.id)} aria-label="Delete module"><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}</ul>
      </div>
    </div>
  );
}

function Lessons() {
  const qc = useQueryClient();
  const { data: cur } = useCurriculum();
  const [moduleId, setModuleId] = useState("m1");
  const [editing, setEditing] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const mod = cur?.modules.find((m) => m.id === moduleId);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!mod) return;
    const id = `${mod.id}-l${Date.now().toString(36)}`;
    if (err((await supabase.from("lessons").insert({ id, module_id: mod.id, title: newTitle, position: mod.lessons.length + 1 })).error)) return;
    setNewTitle("");
    qc.invalidateQueries({ queryKey: ["curriculum"] });
    setEditing(id);
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className={`${card} space-y-3`}>
        <select className={sel} value={moduleId} onChange={(e) => { setModuleId(e.target.value); setEditing(null); }}>{cur?.modules.map((m) => <option key={m.id} value={m.id}>M{m.num} · {m.title}</option>)}</select>
        <ul className="space-y-1">{mod?.lessons.map((l) => (
          <li key={l.id}><button onClick={() => setEditing(l.id)} className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${editing === l.id ? "bg-accent" : "hover:bg-muted"}`}><span>{l.title}</span>{!l.published && <Badge variant="outline">Hidden</Badge>}</button></li>
        ))}</ul>
        <form onSubmit={add} className="flex gap-2"><Input required placeholder="New lesson title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /><Button type="submit" size="icon" aria-label="Add lesson"><Plus className="h-4 w-4" /></Button></form>
      </div>
      {editing ? <LessonEditor key={editing} id={editing} onDeleted={() => setEditing(null)} /> : <p className="text-sm text-muted-foreground">Select a lesson to edit.</p>}
    </div>
  );
}

const LIST_FIELDS: [keyof LessonContent, string][] = [["useCases", "Business use cases"], ["troubleshooting", "Troubleshooting methods"], ["bestPractices", "Best practices"], ["exercises", "Practical exercises"], ["takeaways", "Key takeaways"]];

function LessonEditor({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const qc = useQueryClient();
  const gen = useServerFn(generateLessonContent);
  const { data: lesson, refetch } = useQuery({ queryKey: ["admin-lesson", id], queryFn: async () => (await supabase.from("lessons").select("*").eq("id", id).single()).data });
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [diagram, setDiagram] = useState("");
  const [c, setC] = useState<LessonContent>({});
  const [advanced, setAdvanced] = useState("");
  const [guidance, setGuidance] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    setTitle(lesson.title); setSummary(lesson.summary); setDiagram(lesson.diagram_key ?? "");
    setC((lesson.content ?? {}) as LessonContent);
    setAdvanced(JSON.stringify(lesson.content ?? {}, null, 2));
  }, [lesson]);

  if (!lesson) return <p>Loading…</p>;

  const after = () => { qc.invalidateQueries({ queryKey: ["curriculum"] }); qc.invalidateQueries({ queryKey: ["lesson", id] }); refetch(); };

  async function save(content: LessonContent = c) {
    if (err((await supabase.from("lessons").update({ title, summary, diagram_key: diagram || null, content: content as never, updated_at: new Date().toISOString() }).eq("id", id)).error)) return;
    toast.success("Lesson saved");
    after();
  }
  async function saveAdvanced() {
    try { const parsed = JSON.parse(advanced) as LessonContent; setC(parsed); await save(parsed); } catch { toast.error("Invalid JSON"); }
  }
  async function togglePublish() {
    if (!err((await supabase.from("lessons").update({ published: !lesson!.published }).eq("id", id)).error)) after();
  }
  async function del() {
    if (!confirm("Delete this lesson?")) return;
    if (!err((await supabase.from("lessons").delete().eq("id", id)).error)) { qc.invalidateQueries({ queryKey: ["curriculum"] }); onDeleted(); }
  }
  async function aiGenerate() {
    if (c.explanation && !confirm("Replace the existing detailed content with a new AI-written version?")) return;
    setBusy(true);
    try { await gen({ data: { lessonId: id, guidance: guidance || undefined } }); toast.success("Detailed content generated — review before publishing"); after(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  async function upload(file: File) {
    const path = `${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    if (err((await supabase.storage.from("diagrams").upload(path, file)).error)) return;
    if (!err((await supabase.from("lessons").update({ diagram_image_url: path }).eq("id", id)).error)) { toast.success("Diagram image uploaded"); after(); }
  }

  const listEdit = (k: keyof LessonContent, label: string) => (
    <label key={k} className="block text-sm">{label} <span className="text-xs text-muted-foreground">(one per line)</span>
      <Textarea rows={3} className="mt-1" value={((c[k] as string[] | undefined) ?? []).join("\n")} onChange={(e) => setC({ ...c, [k]: e.target.value.split("\n").filter((x) => x.trim()) })} />
    </label>
  );

  return (
    <div className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Edit lesson</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={togglePublish}>{lesson.published ? <><EyeOff className="mr-1 h-4 w-4" />Unpublish</> : <><Eye className="mr-1 h-4 w-4" />Publish</>}</Button>
          <Button size="sm" variant="ghost" onClick={del}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Short summary" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">Interactive diagram
          <select className={`${sel} mt-1`} value={diagram} onChange={(e) => setDiagram(e.target.value)}>
            <option value="">None</option>
            {Object.entries(DIAGRAMS).map(([k, d]) => <option key={k} value={k}>{d.title}</option>)}
          </select>
        </label>
        <label className="text-sm">Architecture image {lesson.diagram_image_url && <span className="text-xs text-success">(uploaded)</span>}
          <span className="mt-1 flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-muted-foreground hover:bg-muted"><Upload className="h-4 w-4" />Upload image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></span>
        </label>
      </div>

      <div className="rounded-lg border border-dashed p-4">
        <p className="text-sm font-medium">Write detailed content with AI</p>
        <p className="text-xs text-muted-foreground">Generates all sections (theory, architecture, steps, code, errors, interview Q&A, exercises, quiz). Review technical details before publishing.</p>
        <div className="mt-2 flex gap-2"><Input placeholder="Optional guidance, e.g. focus on REST pagination" value={guidance} onChange={(e) => setGuidance(e.target.value)} /><Button onClick={aiGenerate} disabled={busy}><Wand className="mr-1 h-4 w-4" />{busy ? "Writing… (up to a minute)" : "Generate"}</Button></div>
      </div>

      <label className="block text-sm">Introduction<Textarea rows={3} className="mt-1" value={c.intro ?? ""} onChange={(e) => setC({ ...c, intro: e.target.value })} /></label>
      <label className="block text-sm">Detailed explanation (markdown)<Textarea rows={6} className="mt-1" value={c.explanation ?? ""} onChange={(e) => setC({ ...c, explanation: e.target.value })} /></label>
      <label className="block text-sm">Architecture & workflow (markdown)<Textarea rows={4} className="mt-1" value={c.architecture ?? ""} onChange={(e) => setC({ ...c, architecture: e.target.value })} /></label>
      <label className="block text-sm">Practical examples (markdown)<Textarea rows={4} className="mt-1" value={c.examples ?? ""} onChange={(e) => setC({ ...c, examples: e.target.value })} /></label>
      {LIST_FIELDS.map(([k, l]) => listEdit(k, l))}

      <div className="space-y-2">
        <p className="text-sm font-medium">SQL / JSON examples</p>
        {(c.code ?? []).map((x, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <div className="flex gap-2">
              <Input value={x.title} placeholder="Title" onChange={(e) => setC({ ...c, code: c.code!.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)) })} />
              <select className="h-9 rounded-md border bg-card px-2 text-sm" value={x.language} onChange={(e) => setC({ ...c, code: c.code!.map((y, j) => (j === i ? { ...y, language: e.target.value } : y)) })}>{["sql", "json", "text", "powershell"].map((l) => <option key={l}>{l}</option>)}</select>
              <Button size="icon" variant="ghost" onClick={() => setC({ ...c, code: c.code!.filter((_, j) => j !== i) })} aria-label="Remove example"><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea rows={5} className="font-mono text-xs" value={x.code} onChange={(e) => setC({ ...c, code: c.code!.map((y, j) => (j === i ? { ...y, code: e.target.value } : y)) })} />
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setC({ ...c, code: [...(c.code ?? []), { language: "sql", title: "", code: "" }] })}><Plus className="mr-1 h-4 w-4" />Add code example</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Interview questions</p>
        {(c.interview ?? []).map((q, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input value={q.q} placeholder="Question" onChange={(e) => setC({ ...c, interview: c.interview!.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)) })} />
              <Textarea rows={2} value={q.a} placeholder="Answer" onChange={(e) => setC({ ...c, interview: c.interview!.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)) })} />
            </div>
            <Button size="icon" variant="ghost" onClick={() => setC({ ...c, interview: c.interview!.filter((_, j) => j !== i) })} aria-label="Remove question"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setC({ ...c, interview: [...(c.interview ?? []), { q: "", a: "" }] })}><Plus className="mr-1 h-4 w-4" />Add interview question</Button>
      </div>

      <Button onClick={() => save()}>Save lesson</Button>

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">Advanced: edit all content as JSON</summary>
        <Textarea rows={14} className="mt-2 font-mono text-xs" value={advanced} onChange={(e) => setAdvanced(e.target.value)} />
        <Button className="mt-2" size="sm" variant="outline" onClick={saveAdvanced}>Save JSON</Button>
      </details>
    </div>
  );
}

function Questions() {
  const qc = useQueryClient();
  const { data: cur } = useCurriculum();
  const { data: questions } = useQuery({ queryKey: ["admin-questions"], queryFn: async () => (await supabase.from("quiz_questions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [moduleId, setModuleId] = useState("m1");
  const [question, setQuestion] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [expl, setExpl] = useState("");
  const [cert, setCert] = useState(false);
  const [filter, setFilter] = useState("all");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (err((await supabase.from("quiz_questions").insert({ module_id: moduleId, question, options: opts, correct_index: correct, explanation: expl, is_certification: cert })).error)) return;
    toast.success("Question added");
    setQuestion(""); setOpts(["", "", "", ""]); setExpl("");
    qc.invalidateQueries({ queryKey: ["admin-questions"] });
  }
  async function del(id: string) {
    if (!err((await supabase.from("quiz_questions").delete().eq("id", id)).error)) qc.invalidateQueries({ queryKey: ["admin-questions"] });
  }
  const qs = (questions ?? []).filter((q) => filter === "all" || q.module_id === filter);
  return (
    <div className="space-y-6">
      <form onSubmit={add} className={`${card} space-y-3`}>
        <h2 className="font-semibold">Add question</h2>
        <select className={sel} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>{cur?.modules.map((m) => <option key={m.id} value={m.id}>M{m.num} · {m.title}</option>)}</select>
        <Textarea required placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
        {opts.map((o, k) => (
          <div key={k} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={correct === k} onChange={() => setCorrect(k)} aria-label={`Option ${k + 1} correct`} />
            <Input required placeholder={`Option ${k + 1}`} value={o} onChange={(e) => setOpts(opts.map((x, j) => (j === k ? e.target.value : x)))} />
          </div>
        ))}
        <Textarea placeholder="Explanation" value={expl} onChange={(e) => setExpl(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cert} onChange={(e) => setCert(e.target.checked)} /> Include in certification practice exams</label>
        <Button type="submit">Add question</Button>
      </form>
      <div className={card}>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Question bank ({qs.length})</h2>
          <select className="h-9 rounded-md border bg-card px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All modules</option>{cur?.modules.map((m) => <option key={m.id} value={m.id}>M{m.num}</option>)}</select>
        </div>
        <ul className="divide-y">{qs.map((q) => (
          <li key={q.id} className="flex items-start justify-between gap-3 py-3 text-sm">
            <span><span className="mr-2 font-mono text-xs text-muted-foreground">{q.module_id.toUpperCase()}</span>{q.question}</span>
            <Button variant="ghost" size="icon" onClick={() => del(q.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}</ul>
      </div>
    </div>
  );
}

function Labs() {
  const qc = useQueryClient();
  const { data: labs } = useQuery({ queryKey: ["labs"], queryFn: async () => (await supabase.from("labs").select("*").order("created_at")).data ?? [] });
  const [f, setF] = useState({ title: "", area: "", difficulty: "Intermediate", symptom: "", steps: "", root_cause: "", fix: "" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (err((await supabase.from("labs").insert({ ...f, area: f.area || "General", steps: f.steps.split("\n").filter((x) => x.trim()) })).error)) return;
    toast.success("Scenario added");
    setF({ title: "", area: "", difficulty: "Intermediate", symptom: "", steps: "", root_cause: "", fix: "" });
    qc.invalidateQueries({ queryKey: ["labs"] });
  }
  async function update(id: string, patch: Record<string, unknown>) {
    if (!err((await supabase.from("labs").update(patch).eq("id", id)).error)) qc.invalidateQueries({ queryKey: ["labs"] });
  }
  async function del(id: string) {
    if (!err((await supabase.from("labs").delete().eq("id", id)).error)) qc.invalidateQueries({ queryKey: ["labs"] });
  }
  return (
    <div className="space-y-6">
      <form onSubmit={add} className={`${card} grid gap-3 md:grid-cols-3`}>
        <h2 className="font-semibold md:col-span-3">Add troubleshooting scenario</h2>
        <Input required placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input placeholder="Area (e.g. Connectors)" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} />
        <select className={sel} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>{["Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}</select>
        <Textarea required className="md:col-span-3" placeholder="Symptom" value={f.symptom} onChange={(e) => setF({ ...f, symptom: e.target.value })} />
        <Textarea className="md:col-span-3" placeholder="Investigation steps (one per line)" value={f.steps} onChange={(e) => setF({ ...f, steps: e.target.value })} />
        <Textarea placeholder="Root cause" value={f.root_cause} onChange={(e) => setF({ ...f, root_cause: e.target.value })} />
        <Textarea className="md:col-span-2" placeholder="Fix" value={f.fix} onChange={(e) => setF({ ...f, fix: e.target.value })} />
        <Button type="submit" className="w-fit">Add scenario</Button>
      </form>
      <div className={card}>
        <h2 className="mb-3 font-semibold">Scenarios</h2>
        <ul className="divide-y">{labs?.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span><Badge variant="secondary" className="mr-2">{l.area}</Badge>{l.title}</span>
            <span className="flex">
              <Button size="sm" variant="ghost" onClick={() => update(l.id, { published: !l.published })}>{l.published ? "Published" : "Hidden"}</Button>
              <Button size="icon" variant="ghost" onClick={() => del(l.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </span>
          </li>
        ))}</ul>
      </div>
    </div>
  );
}

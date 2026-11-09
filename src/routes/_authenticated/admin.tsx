import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsAdmin } from "@/hooks/use-auth";
import { MODULES } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — IGA Academy AI" }] }),
  component: Admin,
});

function Admin() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return <p>Loading…</p>;
  if (!isAdmin) return <p className="text-muted-foreground">You don't have access to this page.</p>;
  return <AdminInner />;
}

function AdminInner() {
  const qc = useQueryClient();
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [u, a, i, q] = await Promise.all([
        supabase.from("profiles").select("id,full_name,experience_level,created_at").order("created_at", { ascending: false }),
        supabase.from("quiz_attempts").select("score,total"),
        supabase.from("interviews").select("id", { count: "exact", head: true }),
        supabase.from("quiz_questions").select("*").order("created_at", { ascending: false }),
      ]);
      return { users: u.data ?? [], attempts: a.data ?? [], interviews: i.count ?? 0, questions: q.data ?? [] };
    },
  });
  const [moduleId, setModuleId] = useState("m1");
  const [question, setQuestion] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [expl, setExpl] = useState("");
  const [cert, setCert] = useState(false);
  const [filter, setFilter] = useState("all");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("quiz_questions").insert({ module_id: moduleId, question, options: opts, correct_index: correct, explanation: expl, is_certification: cert });
    if (error) { toast.error(error.message); return; }
    toast.success("Question added");
    setQuestion(""); setOpts(["", "", "", ""]); setExpl("");
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }
  async function del(id: string) {
    const { error } = await supabase.from("quiz_questions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-stats"] });
  }

  const d = stats.data;
  const avg = d?.attempts.length ? Math.round(d.attempts.reduce((s, x) => s + (x.score / x.total) * 100, 0) / d.attempts.length) : 0;
  const qs = (d?.questions ?? []).filter((q) => filter === "all" || q.module_id === filter);

  return (
    <div className="space-y-6">
      <PageHeader title="Administrator dashboard" subtitle="Platform usage and question bank management." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[["Users", d?.users.length ?? 0], ["Quiz attempts", d?.attempts.length ?? 0], ["Avg quiz score", `${avg}%`], ["Interviews", d?.interviews ?? 0]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border bg-card p-4 shadow-card"><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-display text-2xl font-semibold">{v}</p></div>
        ))}
      </div>

      <form onSubmit={add} className="space-y-3 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Add question</h2>
        <select className="h-9 w-full rounded-md border bg-card px-3 text-sm" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>{MODULES.map((m) => <option key={m.id} value={m.id}>M{m.num} · {m.title}</option>)}</select>
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

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Question bank ({qs.length})</h2>
          <select className="h-9 rounded-md border bg-card px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All modules</option>{MODULES.map((m) => <option key={m.id} value={m.id}>M{m.num}</option>)}</select>
        </div>
        <ul className="divide-y">{qs.map((q) => (
          <li key={q.id} className="flex items-start justify-between gap-3 py-3 text-sm">
            <span><span className="mr-2 font-mono text-xs text-muted-foreground">{q.module_id.toUpperCase()}</span>{q.question}</span>
            <Button variant="ghost" size="icon" onClick={() => del(q.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}</ul>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-card">
        <h2 className="mb-3 font-semibold">Users</h2>
        <ul className="divide-y">{d?.users.map((u) => (
          <li key={u.id} className="flex justify-between py-2 text-sm"><span>{u.full_name || "—"}</span><span className="text-muted-foreground">{u.experience_level}</span><span className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</span></li>
        ))}</ul>
      </div>
    </div>
  );
}

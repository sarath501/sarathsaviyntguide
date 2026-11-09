import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Bot, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { moduleById } from "@/lib/content";
import { useActivity } from "@/lib/stats";
import { tutorChat } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/Markdown";

export const Route = createFileRoute("/_authenticated/learn/$moduleId")({
  loader: ({ params }) => {
    const m = moduleById(params.moduleId);
    if (!m) throw notFound();
    return { module: m };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.module.title ?? "Module"} — Sarath IGA Learning Portal` }] }),
  component: ModulePage,
});

function ModulePage() {
  const { module: m } = Route.useLoaderData();
  const { data } = useActivity();
  const qc = useQueryClient();
  const done = new Set(data?.progress.map((p) => p.lesson_id));
  const [activeId, setActiveId] = useState(m.lessons[0]!.id);
  const lesson = m.lessons.find((l) => l.id === activeId) ?? m.lessons[0]!;
  const [deep, setDeep] = useState<Record<string, string>>({});
  const [loadingDeep, setLoadingDeep] = useState(false);
  const ask = useServerFn(tutorChat);

  async function toggle() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const res = done.has(lesson.id)
      ? await supabase.from("lesson_progress").delete().eq("lesson_id", lesson.id)
      : await supabase.from("lesson_progress").insert({ user_id: u.user.id, lesson_id: lesson.id, module_id: m.id });
    if (res.error) { toast.error(res.error.message); return; }
    qc.invalidateQueries({ queryKey: ["activity"] });
  }

  async function deepDive() {
    setLoadingDeep(true);
    try {
      const r = await ask({ data: { mode: "a structured lesson with real-world Saviynt examples, a configuration or SQL example if relevant, common mistakes, and 3 interview questions with short answers", messages: [{ role: "user", content: `Teach me "${lesson.title}" (module: ${m.title}) in depth.` }] } });
      setDeep((d) => ({ ...d, [lesson.id]: r.text }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingDeep(false);
    }
  }

  return (
    <div>
      <Link to="/learn" className="text-sm text-muted-foreground hover:text-foreground">← All modules</Link>
      <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Module {m.num}: {m.title}</h1>
      <p className="text-muted-foreground">{m.summary}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-1">
          {m.lessons.map((l) => (
            <button key={l.id} onClick={() => setActiveId(l.id)} className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${l.id === lesson.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}>
              {done.has(l.id) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
              {l.title}
            </button>
          ))}
          <Button asChild variant="outline" className="mt-3 w-full"><Link to="/quiz/$moduleId" params={{ moduleId: m.id }}><ClipboardCheck className="mr-1 h-4 w-4" /> Take module quiz</Link></Button>
        </aside>
        <article className="rounded-xl border bg-card p-6 shadow-card">
          <h2 className="text-xl font-semibold">{lesson.title}</h2>
          <p className="mt-3 leading-relaxed">{lesson.body}</p>
          <h3 className="mt-5 text-sm font-semibold">Key takeaways</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{lesson.points.map((p) => <li key={p}>{p}</li>)}</ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={toggle} variant={done.has(lesson.id) ? "outline" : "default"}>{done.has(lesson.id) ? "Mark as not complete" : "Mark as complete"}</Button>
            <Button variant="secondary" onClick={deepDive} disabled={loadingDeep}><Bot className="mr-1 h-4 w-4" />{loadingDeep ? "Generating…" : "AI deep dive"}</Button>
          </div>
          {deep[lesson.id] && <div className="mt-6 border-t pt-4"><Markdown text={deep[lesson.id] ?? ""} /></div>}
        </article>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurriculum, type LessonContent } from "@/lib/curriculum";
import { useActivity } from "@/lib/stats";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/Markdown";
import { CodeBlock } from "@/components/CodeBlock";
import { Diagram } from "@/components/Diagram";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/_authenticated/lesson/$lessonId")({
  head: () => ({ meta: [{ title: "Lesson — Sarath IGA Learning Portal" }] }),
  component: LessonPage,
});

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 rounded-xl border bg-card p-6 shadow-card">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>;
}

function Quiz({ quiz }: { quiz: NonNullable<LessonContent["quiz"]> }) {
  const [ans, setAns] = useState<Record<number, number>>({});
  return (
    <div className="space-y-4">
      {quiz.map((q, i) => (
        <div key={i}>
          <p className="text-sm font-medium">{i + 1}. {q.question}</p>
          <div className="mt-2 grid gap-1.5">
            {q.options.map((o, k) => {
              const chosen = ans[i] === k, answered = ans[i] !== undefined, right = k === q.answer;
              return (
                <button key={k} disabled={answered} onClick={() => setAns((a) => ({ ...a, [i]: k }))}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${answered && right ? "border-success bg-accent" : chosen ? "border-destructive" : "hover:bg-muted"}`}>
                  {o}{answered && right && <CheckCircle2 className="h-4 w-4 text-success" />}{chosen && !right && <XCircle className="h-4 w-4 text-destructive" />}
                </button>
              );
            })}
          </div>
          {ans[i] !== undefined && <p className="mt-2 text-sm text-muted-foreground">💡 {q.explanation}</p>}
        </div>
      ))}
    </div>
  );
}

function LessonPage() {
  const { lessonId } = Route.useParams();
  const { user } = useUser();
  const qc = useQueryClient();
  const { data: cur } = useCurriculum();
  const { data: act } = useActivity();
  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => (await supabase.from("lessons").select("*").eq("id", lessonId).maybeSingle()).data,
  });
  const { data: bookmarked } = useQuery({
    queryKey: ["bookmark", lessonId],
    queryFn: async () => !!(await supabase.from("bookmarks").select("id").eq("lesson_id", lessonId).maybeSingle()).data,
  });
  const { data: imageUrl } = useQuery({
    queryKey: ["diagram-img", lesson?.diagram_image_url],
    enabled: !!lesson?.diagram_image_url,
    queryFn: async () => (await supabase.storage.from("diagrams").createSignedUrl(lesson!.diagram_image_url!, 3600)).data?.signedUrl ?? null,
  });

  useEffect(() => {
    if (!user || !lesson) return;
    supabase.from("profiles").update({ last_lesson_id: lessonId }).eq("id", user.id).then(() => qc.invalidateQueries({ queryKey: ["profile"] }));
    window.scrollTo({ top: 0 });
  }, [user, lesson, lessonId, qc]);

  if (isLoading || !cur) return <p className="text-muted-foreground">Loading…</p>;
  if (!lesson) return <p className="text-muted-foreground">Lesson not found.</p>;

  const c = (lesson.content ?? {}) as LessonContent;
  const points = (lesson.points ?? []) as string[];
  const mod = cur.modules.find((m) => m.id === lesson.module_id);
  const idx = cur.lessons.findIndex((l) => l.id === lessonId);
  const prev = cur.lessons[idx - 1], next = cur.lessons[idx + 1];
  const done = !!act?.progress.some((p) => p.lesson_id === lessonId);

  async function toggleDone() {
    if (!user) return;
    const r = done
      ? await supabase.from("lesson_progress").delete().eq("lesson_id", lessonId)
      : await supabase.from("lesson_progress").insert({ user_id: user.id, lesson_id: lessonId, module_id: lesson!.module_id });
    if (r.error) { toast.error(r.error.message); return; }
    qc.invalidateQueries({ queryKey: ["activity"] });
    if (!done) toast.success("Lesson completed");
  }
  async function toggleBookmark() {
    if (!user) return;
    const r = bookmarked
      ? await supabase.from("bookmarks").delete().eq("lesson_id", lessonId)
      : await supabase.from("bookmarks").insert({ user_id: user.id, lesson_id: lessonId });
    if (r.error) { toast.error(r.error.message); return; }
    qc.invalidateQueries({ queryKey: ["bookmark", lessonId] });
    qc.invalidateQueries({ queryKey: ["bookmarks"] });
  }

  const hasDiagram = !!lesson.diagram_key || !!imageUrl;
  const toc: [string, string, boolean][] = [
    ["intro", "Introduction", true],
    ["explanation", "Detailed explanation", !!c.explanation],
    ["concepts", "Technical concepts", !!c.concepts?.length],
    ["architecture", "Architecture & workflow", !!c.architecture || hasDiagram],
    ["steps", "Step-by-step implementation", !!c.steps?.length],
    ["usecases", "Business use cases", !!c.useCases?.length],
    ["examples", "Practical examples", !!c.examples],
    ["code", "Configuration & code", !!c.code?.length],
    ["errors", "Common errors", !!c.errors?.length],
    ["troubleshooting", "Troubleshooting", !!c.troubleshooting?.length],
    ["best", "Best practices", !!c.bestPractices?.length],
    ["interview", "Interview Q&A", !!c.interview?.length],
    ["exercises", "Practical exercises", !!c.exercises?.length],
    ["takeaways", "Key takeaways", !!(c.takeaways?.length || points.length)],
    ["quiz", "Knowledge check", !!c.quiz?.length],
  ];
  const sections = toc.filter((t) => t[2]);

  return (
    <div>
      <Link to="/learn/$moduleId" params={{ moduleId: lesson.module_id }} className="text-sm text-muted-foreground hover:text-foreground">← Module {mod?.num}: {mod?.title}</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <h1 className="max-w-3xl text-2xl font-semibold md:text-3xl">{lesson.title}</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={toggleBookmark}>{bookmarked ? <BookmarkCheck className="mr-1 h-4 w-4 text-primary" /> : <Bookmark className="mr-1 h-4 w-4" />}{bookmarked ? "Bookmarked" : "Bookmark"}</Button>
          <Button size="sm" variant={done ? "outline" : "default"} onClick={toggleDone}>{done ? <><CheckCircle2 className="mr-1 h-4 w-4 text-success" />Completed</> : "Mark as completed"}</Button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block">
          <div className="sticky top-6 space-y-0.5 border-l pl-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
            {sections.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="block py-1 text-sm text-muted-foreground hover:text-primary">{label}</a>
            ))}
          </div>
        </nav>
        <div className="min-w-0 space-y-5">
          <Section id="intro" title="Introduction">{c.intro ? <Markdown text={c.intro} /> : <p className="text-sm leading-relaxed">{lesson.summary}</p>}</Section>
          {c.explanation && <Section id="explanation" title="Detailed explanation"><Markdown text={c.explanation} /></Section>}
          {!!c.concepts?.length && (
            <Section id="concepts" title="Technical concepts">
              <div className="grid gap-3 sm:grid-cols-2">{c.concepts.map((x) => <div key={x.term} className="rounded-lg border p-3"><p className="text-sm font-semibold text-primary">{x.term}</p><p className="mt-1 text-sm text-muted-foreground">{x.detail}</p></div>)}</div>
            </Section>
          )}
          {(c.architecture || hasDiagram) && (
            <Section id="architecture" title="Architecture & workflow">
              <div className="space-y-4">
                {lesson.diagram_key && <Diagram diagramKey={lesson.diagram_key} />}
                {imageUrl && <img src={imageUrl} alt={`${lesson.title} diagram`} className="w-full rounded-lg border" />}
                {c.architecture && <Markdown text={c.architecture} />}
              </div>
            </Section>
          )}
          {!!c.steps?.length && (
            <Section id="steps" title="Step-by-step implementation">
              <ol className="space-y-3">{c.steps.map((s, i) => (
                <li key={i} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary font-mono text-xs text-primary-foreground">{i + 1}</span><div><p className="text-sm font-semibold">{s.title}</p><p className="text-sm text-muted-foreground">{s.detail}</p></div></li>
              ))}</ol>
            </Section>
          )}
          {!!c.useCases?.length && <Section id="usecases" title="Real-world business use cases"><Bullets items={c.useCases} /></Section>}
          {c.examples && <Section id="examples" title="Practical examples"><Markdown text={c.examples} /></Section>}
          {!!c.code?.length && (
            <Section id="code" title="Configuration & code examples">
              <div className="space-y-5">{c.code.map((x, i) => (
                <div key={i} className="space-y-2">
                  <CodeBlock code={x.code} language={x.language} title={x.title} />
                  {x.output && x.output.columns?.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border">
                      <p className="border-b bg-muted px-3 py-1.5 text-xs font-semibold">Sample output</p>
                      <table className="w-full text-xs"><thead><tr>{x.output.columns.map((h) => <th key={h} className="border-b px-3 py-1.5 text-left font-mono">{h}</th>)}</tr></thead>
                        <tbody>{x.output.rows.map((r, j) => <tr key={j} className="border-b last:border-0">{r.map((v, k) => <td key={k} className="px-3 py-1.5 font-mono">{String(v)}</td>)}</tr>)}</tbody></table>
                    </div>
                  )}
                  {x.note && <p className="text-xs text-muted-foreground">ℹ️ {x.note}</p>}
                </div>
              ))}</div>
            </Section>
          )}
          {!!c.errors?.length && (
            <Section id="errors" title="Common errors">
              <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="bg-muted text-left"><th className="p-2">Error</th><th className="p-2">Likely cause</th><th className="p-2">Fix</th></tr></thead>
                <tbody>{c.errors.map((e, i) => <tr key={i} className="border-t align-top"><td className="p-2 font-medium">{e.error}</td><td className="p-2 text-muted-foreground">{e.cause}</td><td className="p-2">{e.fix}</td></tr>)}</tbody></table></div>
            </Section>
          )}
          {!!c.troubleshooting?.length && <Section id="troubleshooting" title="Troubleshooting methods"><Bullets items={c.troubleshooting} /></Section>}
          {!!c.bestPractices?.length && <Section id="best" title="Best practices"><Bullets items={c.bestPractices} /></Section>}
          {!!c.interview?.length && (
            <Section id="interview" title="Interview questions & answers">
              <Accordion type="multiple">{c.interview.map((q, i) => (
                <AccordionItem key={i} value={String(i)}><AccordionTrigger className="text-left text-sm">{q.q}</AccordionTrigger><AccordionContent><p className="text-sm leading-relaxed text-muted-foreground">{q.a}</p></AccordionContent></AccordionItem>
              ))}</Accordion>
            </Section>
          )}
          {!!c.exercises?.length && <Section id="exercises" title="Practical exercises"><Bullets items={c.exercises} /></Section>}
          {!!(c.takeaways?.length || points.length) && <Section id="takeaways" title="Key takeaways"><Bullets items={c.takeaways?.length ? c.takeaways : points} /></Section>}
          {!!c.quiz?.length && <Section id="quiz" title="Knowledge check"><Quiz quiz={c.quiz} /></Section>}
          {!c.explanation && <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">Detailed content for this lesson is being prepared.</p>}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
            {prev ? <Button asChild variant="outline"><Link to="/lesson/$lessonId" params={{ lessonId: prev.id }}><ChevronLeft className="mr-1 h-4 w-4" /><span className="max-w-48 truncate">{prev.title}</span></Link></Button> : <span />}
            <Button onClick={toggleDone} variant={done ? "outline" : "default"}>{done ? "Completed ✓" : "Mark as completed"}</Button>
            {next ? <Button asChild variant="outline"><Link to="/lesson/$lessonId" params={{ lessonId: next.id }}><span className="max-w-48 truncate">{next.title}</span><ChevronRight className="ml-1 h-4 w-4" /></Link></Button> : <span />}
          </div>
        </div>
      </div>
    </div>
  );
}

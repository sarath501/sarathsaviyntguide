import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { QuizRunner, type Q } from "@/components/Quiz";
import { useActivity } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/certification")({
  head: () => ({ meta: [{ title: "Certification Prep — IGA Academy AI" }] }),
  component: Cert,
});

const EXAMS = [
  { id: "professional", title: "Saviynt IGA Professional — Practice", count: 15, minutes: 20, level: "Core concepts across all modules" },
  { id: "advanced", title: "Saviynt IGA Advanced — Practice", count: 20, minutes: 25, level: "Deeper implementation & troubleshooting" },
];

function Cert() {
  const [exam, setExam] = useState<{ id: string; qs: Q[]; minutes: number } | null>(null);
  const { data } = useActivity();
  const history = (data?.attempts ?? []).filter((a) => a.is_certification).slice(-5).reverse();

  async function start(e: (typeof EXAMS)[number]) {
    let query = supabase.from("quiz_questions").select("*");
    if (e.id === "professional") query = query.eq("is_certification", true);
    const { data } = await query;
    const qs = ((data ?? []) as unknown as Q[]).sort(() => Math.random() - 0.5).slice(0, e.count);
    setExam({ id: e.id, qs, minutes: e.minutes });
  }

  if (exam) return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Practice exam" subtitle={`${exam.qs.length} questions · ${exam.minutes} minutes`} />
      <QuizRunner questions={exam.qs} moduleId={`cert-${exam.id}`} certification timeLimitSec={exam.minutes * 60} onDone={() => setExam(null)} />
    </div>
  );

  return (
    <div>
      <PageHeader title="Certification Preparation" subtitle="Timed practice exams modeled on Saviynt IGA certification topics. Pass mark: 70%." />
      <div className="grid gap-4 md:grid-cols-2">
        {EXAMS.map((e) => (
          <div key={e.id} className="rounded-xl border bg-card p-6 shadow-card">
            <Award className="h-6 w-6 text-primary" />
            <h3 className="mt-3 text-lg font-semibold">{e.title}</h3>
            <p className="text-sm text-muted-foreground">{e.level}</p>
            <p className="mt-3 flex items-center gap-1 text-sm"><Timer className="h-4 w-4" /> {e.count} questions · {e.minutes} min</p>
            <Button className="mt-4" onClick={() => start(e)}>Start exam</Button>
          </div>
        ))}
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Recent attempts</h2>
      {history.length ? (
        <ul className="divide-y rounded-xl border bg-card">
          {history.map((h, k) => (
            <li key={k} className="flex justify-between p-3 text-sm"><span>{h.module_id.replace("cert-", "").toUpperCase()}</span><span>{h.score}/{h.total} · {Math.round((h.score / h.total) * 100)}%</span><span className="text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span></li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">No attempts yet.</p>}
      <p className="mt-6 text-xs text-muted-foreground">Practice content is independently written and not official Saviynt exam material.</p>
    </div>
  );
}

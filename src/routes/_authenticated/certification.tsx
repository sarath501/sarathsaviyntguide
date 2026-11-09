import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Award, Timer, ShieldCheck, Target } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuizRunner, type Q } from "@/components/Quiz";
import { useActivity } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/certification")({
  head: () => ({ meta: [{ title: "Saviynt Mock Exams — Sarath IGA Learning Portal" }] }),
  component: Cert,
});

const EXAMS = [
  {
    id: "professional",
    title: "Saviynt IGA Professional",
    subtitle: "Full-length Professional practice exam",
    count: 50,
    minutes: 75,
    level: "Core IGA implementation and operational knowledge",
    topics: "Identity lifecycle, application onboarding, connectors, access requests, certifications, SoD and operations",
  },
  {
    id: "advanced",
    title: "Saviynt IGA Advanced",
    subtitle: "Full-length Advanced implementation and troubleshooting exam",
    count: 50,
    minutes: 90,
    level: "Scenario-based design, troubleshooting and governance decisions",
    topics: "Complex correlation, REST/JDBC/SCIM, provisioning failures, role engineering, SoD, scale, cutover and audit evidence",
  },
];

function Cert() {
  const [exam, setExam] = useState<{ id: string; title: string; qs: Q[]; minutes: number } | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const { data } = useActivity();
  const history = (data?.attempts ?? []).filter((a) => a.is_certification).slice(-8).reverse();

  async function start(e: (typeof EXAMS)[number]) {
    setStarting(e.id);
    try {
      const { data: rows, error } = await supabase
        .from("quiz_questions")
        .select("id,module_id,question,options,correct_index,explanation")
        .eq("is_certification", true)
        .eq("exam_track", e.id);
      if (error) throw error;
      const qs = ((rows ?? []) as unknown as Q[]).sort(() => Math.random() - 0.5).slice(0, e.count);
      if (qs.length < e.count) {
        toast.error(`This exam needs ${e.count} questions, but only ${qs.length} are available. Apply the Phase 5 question-bank migration first.`);
        return;
      }
      setExam({ id: e.id, title: e.title, qs, minutes: e.minutes });
    } catch (error) {
      toast.error((error as Error).message || "Unable to load the mock exam.");
    } finally {
      setStarting(null);
    }
  }

  if (exam) return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={exam.title} subtitle={`${exam.qs.length} scenario-based questions · ${exam.minutes} minutes · Pass mark 70%`} />
      <QuizRunner questions={exam.qs} moduleId={`cert-${exam.id}`} certification timeLimitSec={exam.minutes * 60} onDone={() => setExam(null)} />
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Saviynt IGA Mock Exams" subtitle="Dedicated 50-question Professional and Advanced practice banks with timed, randomized questions and explanations." />
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
        <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" />Independent exam preparation</div>
        <p className="mt-1 text-muted-foreground">These are original practice questions based on common Saviynt IGA implementation and governance concepts. They are not official Saviynt exam questions, exam dumps, or a guarantee of certification exam coverage.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {EXAMS.map((e) => (
          <div key={e.id} className="rounded-xl border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <Award className="h-7 w-7 text-primary" />
              <Badge variant={e.id === "advanced" ? "default" : "secondary"}>{e.id === "advanced" ? "Advanced" : "Professional"}</Badge>
            </div>
            <h2 className="mt-4 text-xl font-semibold">{e.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{e.subtitle}</p>
            <p className="mt-3 text-sm">{e.level}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Target className="h-4 w-4" />{e.count} questions</span>
              <span className="flex items-center gap-1"><Timer className="h-4 w-4" />{e.minutes} minutes</span>
              <span>70% pass mark</span>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Coverage: {e.topics}.</p>
            <Button className="mt-5" onClick={() => start(e)} disabled={starting !== null}>
              {starting === e.id ? "Loading exam…" : "Start mock exam"}
            </Button>
          </div>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent mock-exam attempts</h2>
        {history.length ? (
          <ul className="divide-y rounded-xl border bg-card">
            {history.map((h, k) => (
              <li key={k} className="flex flex-wrap justify-between gap-2 p-3 text-sm">
                <span className="font-medium">{h.module_id.replace("cert-", "").toUpperCase()}</span>
                <span>{h.score}/{h.total} · {Math.round((h.score / h.total) * 100)}%</span>
                <span className="text-muted-foreground">{new Date(h.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        ) : <p className="rounded-xl border p-5 text-sm text-muted-foreground">No mock-exam attempts yet. Complete an exam to see your history here.</p>}
      </section>
    </div>
  );
}

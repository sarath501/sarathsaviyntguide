import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export type Q = { id: string; module_id: string; question: string; options: string[]; correct_index: number; explanation: string };

export function QuizRunner({ questions, moduleId, certification, timeLimitSec, onDone }: { questions: Q[]; moduleId: string; certification?: boolean; timeLimitSec?: number; onDone?: () => void }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [left, setLeft] = useState(timeLimitSec ?? 0);
  const qc = useQueryClient();

  useEffect(() => {
    if (!timeLimitSec || submitted) return;
    const t = setInterval(() => setLeft((x) => x - 1), 1000);
    return () => clearInterval(t);
  }, [timeLimitSec, submitted]);
  useEffect(() => {
    if (timeLimitSec && left <= 0 && !submitted) void submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const score = questions.filter((q) => answers[q.id] === q.correct_index).length;

  async function submit() {
    setSubmitted(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("quiz_attempts").insert({ user_id: u.user.id, module_id: moduleId, score, total: questions.length, is_certification: !!certification });
    if (error) toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["activity"] });
  }

  const pct = Math.round((score / Math.max(1, questions.length)) * 100);
  return (
    <div className="space-y-4">
      {timeLimitSec && !submitted && (
        <div className="sticky top-2 z-10 ml-auto w-fit rounded-full bg-navy px-4 py-1 font-mono text-sm text-navy-foreground">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </div>
      )}
      {submitted && (
        <div className={`rounded-xl border p-5 ${pct >= 70 ? "bg-accent" : "bg-muted"}`}>
          <p className="font-display text-2xl font-semibold">{score}/{questions.length} · {pct}%</p>
          <p className="text-sm text-muted-foreground">{pct >= 70 ? "Passed — great work." : "Below the 70% pass mark. Review the explanations below."}</p>
          {onDone && <Button className="mt-3" variant="outline" onClick={onDone}>Done</Button>}
        </div>
      )}
      {questions.map((q, i) => (
        <div key={q.id} className="rounded-xl border bg-card p-5 shadow-card">
          <p className="font-medium"><span className="mr-2 font-mono text-xs text-muted-foreground">Q{i + 1}</span>{q.question}</p>
          <div className="mt-3 grid gap-2">
            {q.options.map((o, k) => {
              const chosen = answers[q.id] === k;
              const correct = submitted && k === q.correct_index;
              const wrong = submitted && chosen && k !== q.correct_index;
              return (
                <button key={k} disabled={submitted} onClick={() => setAnswers((a) => ({ ...a, [q.id]: k }))}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${correct ? "border-success bg-accent" : wrong ? "border-destructive" : chosen ? "border-primary bg-accent" : "hover:bg-muted"}`}>
                  {o}
                  {correct && <CheckCircle2 className="h-4 w-4 text-success" />}
                  {wrong && <XCircle className="h-4 w-4 text-destructive" />}
                </button>
              );
            })}
          </div>
          {submitted && q.explanation && <p className="mt-3 text-sm text-muted-foreground">💡 {q.explanation}</p>}
        </div>
      ))}
      {!submitted && (
        <Button size="lg" onClick={submit} disabled={Object.keys(answers).length < questions.length}>
          Submit ({Object.keys(answers).length}/{questions.length} answered)
        </Button>
      )}
    </div>
  );
}

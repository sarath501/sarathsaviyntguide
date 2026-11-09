import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/Markdown";
import { tutorChat } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/labs")({
  head: () => ({ meta: [{ title: "Troubleshooting Lab — Sarath IGA Learning Portal" }] }),
  component: Labs,
});

function Labs() {
  const [open, setOpen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [answer, setAnswer] = useState<Record<string, string>>({});
  const [review, setReview] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(tutorChat);
  const { data: labRows } = useQuery({
    queryKey: ["labs"],
    queryFn: async () => (await supabase.from("labs").select("*").order("created_at")).data ?? [],
  });
  const LABS = (labRows ?? []).map((l) => ({ ...l, steps: (l.steps ?? []) as string[], rootCause: l.root_cause }));

  async function grade(id: string) {
    const lab = LABS.find((l) => l.id === id);
    if (!lab) return;
    setBusy(true);
    try {
      const r = await ask({ data: { mode: "a concise coach review: what was right, what was missed, rating out of 10", messages: [{ role: "user", content: `Scenario: ${lab.symptom}\nActual root cause: ${lab.rootCause}\nCorrect fix: ${lab.fix}\n\nMy diagnosis:\n${answer[id]}\n\nReview my diagnosis.` }] } });
      setReview((x) => ({ ...x, [id]: r.text }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Real-World Troubleshooting Lab" subtitle="Diagnose production-style incidents. Write your approach, get AI feedback, then reveal the root cause." />
      <div className="space-y-4">
        {LABS.map((l) => (
          <div key={l.id} className="rounded-xl border bg-card p-5 shadow-card">
            <button className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setOpen(open === l.id ? null : l.id)}>
              <div>
                <h3 className="font-semibold">{l.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{l.symptom}</p>
              </div>
              <div className="flex shrink-0 gap-2"><Badge variant="secondary">{l.area}</Badge><Badge variant="outline">{l.difficulty}</Badge></div>
            </button>
            {open === l.id && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <Textarea rows={4} placeholder="How would you investigate? What do you suspect?" value={answer[l.id] ?? ""} onChange={(e) => setAnswer((a) => ({ ...a, [l.id]: e.target.value }))} />
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy || !answer[l.id]?.trim()} onClick={() => grade(l.id)}>{busy ? "Reviewing…" : "Get AI feedback"}</Button>
                  <Button variant="outline" onClick={() => setRevealed((r) => ({ ...r, [l.id]: true }))}>Reveal solution</Button>
                </div>
                {review[l.id] && <div className="rounded-lg bg-muted p-4"><Markdown text={review[l.id] ?? ""} /></div>}
                {revealed[l.id] && (
                  <div className="space-y-3 text-sm">
                    <div><p className="font-semibold">Investigation steps</p><ol className="mt-1 list-decimal space-y-1 pl-5">{l.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
                    <p><span className="font-semibold">Root cause: </span>{l.rootCause}</p>
                    <p><span className="font-semibold">Fix: </span>{l.fix}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/Markdown";
import { interviewEvaluate, interviewTurn } from "@/lib/ai.functions";
import { useActivity } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/interview")({
  head: () => ({ meta: [{ title: "Mock Interviews — IGA Academy AI" }] }),
  component: Interview,
});

const TOPICS = ["Saviynt EIC general", "Application onboarding & connectors", "Access requests & workflows", "Access certifications", "RBAC & SoD", "Saviynt SQL & analytics", "Troubleshooting scenarios", "IAM architecture"];
const LEVELS = ["Junior (0-2 yrs)", "Mid-level (3-5 yrs)", "Senior (6+ yrs)", "Architect"];
type Msg = { role: "user" | "assistant"; content: string };

function Interview() {
  const [topic, setTopic] = useState<string>(TOPICS[0]!);
  const [level, setLevel] = useState<string>(LEVELS[1]!);
  const [id, setId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ score: number | null; feedback: string } | null>(null);
  const turn = useServerFn(interviewTurn);
  const evaluate = useServerFn(interviewEvaluate);
  const qc = useQueryClient();
  const { data } = useActivity();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  async function start() {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data: row, error } = await supabase.from("interviews").insert({ user_id: u.user!.id, topic, level }).select("id").single();
      if (error) throw error;
      setId(row.id);
      setResult(null);
      const r = await turn({ data: { topic, level, messages: [] } });
      setMsgs([{ role: "assistant", content: r.text }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!input.trim()) return;
    const next = [...msgs, { role: "user" as const, content: input.trim() }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await turn({ data: { topic, level, messages: next } });
      setMsgs([...next, { role: "assistant", content: r.text }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!id) return;
    setBusy(true);
    try {
      const r = await evaluate({ data: { interviewId: id, topic, level, messages: msgs } });
      setResult(r);
      qc.invalidateQueries({ queryKey: ["activity"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!id) {
    const past = (data?.interviews ?? []).filter((i) => i.score != null).slice(-5).reverse();
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="AI Mock Interviews" subtitle="An adaptive interviewer asks one question at a time, then scores your performance." />
        <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-card md:grid-cols-2">
          <label className="text-sm">Topic
            <select className="mt-1 h-9 w-full rounded-md border bg-card px-3" value={topic} onChange={(e) => setTopic(e.target.value)}>{TOPICS.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <label className="text-sm">Level
            <select className="mt-1 h-9 w-full rounded-md border bg-card px-3" value={level} onChange={(e) => setLevel(e.target.value)}>{LEVELS.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
          <Button className="md:col-span-2" onClick={start} disabled={busy}>{busy ? "Starting…" : "Start interview"}</Button>
        </div>
        <h2 className="mb-3 mt-8 text-lg font-semibold">Past interviews</h2>
        {past.length ? <ul className="divide-y rounded-xl border bg-card">{past.map((p) => <li key={p.id} className="flex justify-between p-3 text-sm"><span>{p.topic} · {p.level}</span><span className="font-medium">{p.score}/100</span></li>)}</ul> : <p className="text-sm text-muted-foreground">No completed interviews yet.</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={topic} subtitle={level} action={!result && <Button variant="outline" onClick={finish} disabled={busy || msgs.length < 3}>End & get feedback</Button>} />
      <div className="space-y-4">
        {msgs.map((m, k) => (
          <div key={k} className={m.role === "user" ? "ml-auto max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground" : "max-w-[90%]"}>
            {m.role === "user" ? m.content : <Markdown text={m.content} />}
          </div>
        ))}
        {busy && <p className="animate-pulse text-sm text-muted-foreground">Interviewer is thinking…</p>}
        <div ref={endRef} />
      </div>
      {result ? (
        <div className="mt-6 rounded-xl border bg-card p-6 shadow-card">
          <p className="font-display text-3xl font-semibold">{result.score ?? "—"}<span className="text-base text-muted-foreground">/100</span></p>
          <Markdown text={result.feedback} />
          <Button className="mt-4" onClick={() => { setId(null); setMsgs([]); }}>New interview</Button>
        </div>
      ) : (
        <div className="sticky bottom-4 mt-6 flex gap-2 rounded-xl border bg-card p-2 shadow-card">
          <Textarea autoFocus rows={2} className="border-0 shadow-none focus-visible:ring-0" placeholder="Type your answer…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
          <Button size="icon" onClick={send} disabled={busy || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
        </div>
      )}
    </div>
  );
}

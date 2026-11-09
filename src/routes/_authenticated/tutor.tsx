import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Send, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/Markdown";
import { LogoMark } from "@/components/Logo";
import { tutorChat } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({ meta: [{ title: "AI Tutor — Sarath IGA Learning Portal" }] }),
  component: Tutor,
});

const MODES = ["Normal", "Explain like I'm a beginner", "Technical deep dive", "Interview-style answer", "Step-by-step configuration"];
const STARTERS = ["Explain the Saviynt identity data model", "Write SQL to find orphan accounts", "How does a REST connector ImportAccountEntJSON work?", "What's the difference between preventive and detective SoD?"];
type Msg = { role: "user" | "assistant"; content: string };

function Tutor() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState(MODES[0]);
  const [busy, setBusy] = useState(false);
  const ask = useServerFn(tutorChat);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs, busy]);

  async function send(text = input) {
    if (!text.trim() || busy) return;
    const next = [...msgs, { role: "user" as const, content: text.trim() }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const r = await ask({ data: { messages: next, mode: mode === "Normal" ? undefined : mode } });
      setMsgs([...next, { role: "assistant", content: r.text }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      taRef.current?.focus();
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
      <PageHeader title="AI Learning Assistant" subtitle="Ask anything about Saviynt, IGA and IAM."
        action={<div className="flex gap-2">
          <select className="h-9 rounded-md border bg-card px-3 text-sm" value={mode} onChange={(e) => setMode(e.target.value)}>{MODES.map((m) => <option key={m}>{m}</option>)}</select>
          {msgs.length > 0 && <Button variant="outline" size="icon" onClick={() => setMsgs([])} aria-label="New conversation"><RotateCcw className="h-4 w-4" /></Button>}
        </div>} />
      {msgs.length === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {STARTERS.map((s) => <button key={s} onClick={() => send(s)} className="card-lift rounded-xl border bg-card p-4 text-left text-sm shadow-card">{s}</button>)}
        </div>
      )}
      <div className="space-y-5">
        {msgs.map((m, k) => m.role === "user" ? (
          <div key={k} className="ml-auto max-w-[85%] rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground">{m.content}</div>
        ) : (
          <div key={k} className="flex gap-3"><LogoMark className="h-7 w-7 shrink-0" /><div className="min-w-0 flex-1"><Markdown text={m.content} /></div></div>
        ))}
        {busy && <div className="flex gap-3"><LogoMark className="h-7 w-7 animate-pulse" /><p className="text-sm text-muted-foreground">Thinking…</p></div>}
        <div ref={endRef} />
      </div>
      <div className="sticky bottom-4 mt-6 flex gap-2 rounded-xl border bg-card p-2 shadow-card">
        <Textarea ref={taRef} autoFocus rows={2} className="border-0 shadow-none focus-visible:ring-0" placeholder="Ask about connectors, SQL, workflows…" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }} />
        <Button size="icon" onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

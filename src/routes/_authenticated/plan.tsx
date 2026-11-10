import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/Markdown";
import { generatePlan } from "@/lib/ai.functions";
import { useProfile } from "@/hooks/use-auth";
import { computeStats, useActivity } from "@/lib/stats";
import { useCurriculum } from "@/lib/curriculum";

export const Route = createFileRoute("/_authenticated/plan")({
  beforeLoad: () => { throw redirect({ to: "/dashboard" }); },
  head: () => ({ meta: [{ title: "Learning Path — Sarath IGA Learning Portal" }] }),
  component: Plan,
});

const GOALS = ["Crack a Saviynt interview", "Pass Saviynt IGA certification", "Become a Saviynt developer", "Move into an IAM architect role", "Learn IGA from scratch"];

function Plan() {
  const { data: profile } = useProfile();
  const { data } = useActivity();
  const { data: cur } = useCurriculum();
  const [goal, setGoal] = useState<string>(GOALS[0]!);
  const [hours, setHours] = useState(8);
  const [weeks, setWeeks] = useState(6);
  const [plan, setPlan] = useState("");
  const [busy, setBusy] = useState(false);
  const gen = useServerFn(generatePlan);

  async function run() {
    setBusy(true);
    try {
      const s = data && cur ? computeStats(data, cur) : null;
      const scored = s?.topic.filter((t) => t.score != null) ?? [];
      const weak = scored.filter((t) => (t.score ?? 0) < 70).map((t) => t.title).join(", ");
      const strengths = scored.filter((t) => (t.score ?? 0) >= 70).map((t) => t.title).join(", ");
      const r = await gen({ data: { level: profile?.experience_level ?? "Beginner", goal, hours, weeks, weak, strengths } });
      setPlan(r.text);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Personalized Learning Path" subtitle="An AI-generated study plan based on your level, goal and quiz results." />
      <div className="grid gap-4 rounded-xl border bg-card p-6 shadow-card md:grid-cols-3">
        <label className="text-sm md:col-span-3">Goal
          <select className="mt-1 h-9 w-full rounded-md border bg-card px-3" value={goal} onChange={(e) => setGoal(e.target.value)}>{GOALS.map((g) => <option key={g}>{g}</option>)}</select>
        </label>
        <label className="text-sm">Hours / week<Input type="number" min={1} max={60} value={hours} onChange={(e) => setHours(+e.target.value)} className="mt-1" /></label>
        <label className="text-sm">Weeks<Input type="number" min={1} max={26} value={weeks} onChange={(e) => setWeeks(+e.target.value)} className="mt-1" /></label>
        <div className="flex items-end"><Button className="w-full" onClick={run} disabled={busy}>{busy ? "Generating…" : "Generate plan"}</Button></div>
      </div>
      {plan && <div className="mt-6 rounded-xl border bg-card p-6 shadow-card"><Markdown text={plan} /></div>}
    </div>
  );
}

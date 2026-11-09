import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ChevronDown, ChevronUp, Lightbulb, RotateCcw, Trophy } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/labs")({
  head: () => ({ meta: [{ title: "Interactive Saviynt Labs — Sarath IGA Learning Portal" }] }),
  component: Labs,
});

type Lab = {
  id: string; title: string; area: string; difficulty: string; symptom: string;
  root_cause: string; fix: string; steps: string[];
};
type Progress = {
  lab_id: string; completed_steps: string[]; diagnosis: string; score: number; completed: boolean;
};

const HINTS: Record<string, string> = {
  "Active Directory": "Trace the request from workflow to provisioning task, then inspect connector reachability, bind account permissions, distinguished names and target response.",
  "SAP": "Separate connectivity, authentication, authorization and target-side validation. Capture the exact SAP return message before changing configuration.",
  "REST": "Check HTTP method and URL, token acquisition, scopes, headers, pagination, response mapping and rate limits in that order.",
  "JDBC": "Validate network path, listener/port, driver, JDBC URL, service account privileges, SQL syntax and returned result-set columns.",
  "SFTP": "Validate DNS, host/port reachability, key or password authentication, remote directory permissions, filename pattern and file encoding.",
};
const PRACTICE = [
  { title: "SQL: find accounts without a linked identity", area: "SQL Practice", prompt: "Write a query approach to identify imported accounts that do not map to a user. State the join key and how you would avoid duplicate rows.", hint: "Start from accounts and use a LEFT JOIN to the identity/account mapping table; filter rows where the identity-side key is NULL. Confirm actual table names in your tenant schema." },
  { title: "JSON: review a REST connector response mapping", area: "JSON Practice", prompt: "A REST response contains a nested array of users with employeeId, email and status. Describe the JSON path and attribute mapping checks you would perform before aggregation.", hint: "Inspect the response root, array path, pagination envelope, null handling, unique correlation key and status normalization. Do not assume a JSON path without seeing the actual payload." },
  { title: "Troubleshooting: account aggregation is incomplete", area: "Incident Triage", prompt: "An aggregation job completes successfully but only a fraction of expected accounts appear. List the first five checks and the evidence you would collect.", hint: "Compare source-side count with fetched, processed, rejected and correlated counts; inspect filters, pagination, permissions, delta watermark and connector logs." },
];

function Labs() {
  const [open, setOpen] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<Record<string, boolean>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [practiceOpen, setPracticeOpen] = useState<string | null>(null);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, string>>({});
  const [diagnosisDraft, setDiagnosisDraft] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: labRows = [], isLoading } = useQuery({
    queryKey: ["labs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("labs").select("*").eq("published", true).order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: userData } = useQuery({
    queryKey: ["lab-progress-user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });
  const userId = userData?.id;
  const { data: savedProgress = [] } = useQuery({
    queryKey: ["lab-progress", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("lab_progress").select("*").eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });

  const progressByLab = useMemo(() => Object.fromEntries(savedProgress.map((p) => [p.lab_id, p as Progress])), [savedProgress]);
  const saveProgress = useMutation({
    mutationFn: async (value: Progress) => {
      if (!userId) throw new Error("Please sign in again to save lab progress.");
      const { error } = await supabase.from("lab_progress").upsert({
        user_id: userId, lab_id: value.lab_id, completed_steps: value.completed_steps,
        diagnosis: value.diagnosis, score: value.score, completed: value.completed,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,lab_id" });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["lab-progress", userId] }),
    onError: (error) => toast.error(error.message || "Unable to save progress."),
  });

  const labs: Lab[] = labRows.map((row) => ({
    id: row.id, title: row.title, area: row.area, difficulty: row.difficulty,
    symptom: row.symptom, root_cause: row.root_cause, fix: row.fix,
    steps: Array.isArray(row.steps) ? row.steps as string[] : [],
  }));
  const completedCount = savedProgress.filter((p) => p.completed).length;
  const totalScore = savedProgress.reduce((sum, p) => sum + (p.score ?? 0), 0);
  const hintFor = (area: string) => HINTS[Object.keys(HINTS).find((key) => area.toLowerCase().includes(key.toLowerCase())) ?? ""] ?? "Establish the expected behaviour, reproduce the issue, isolate the failing layer, collect timestamped logs and validate the fix with a controlled retest.";

  function update(lab: Lab, changes: Partial<Progress>) {
    const current = progressByLab[lab.id] ?? { lab_id: lab.id, completed_steps: [], diagnosis: "", score: 0, completed: false };
    const next = { ...current, ...changes };
    const stepCount = Math.max(lab.steps.length, 1);
    const score = Math.round((next.completed_steps.length / stepCount) * 70 + (next.diagnosis.trim().length >= 80 ? 30 : 0));
    const completed = next.completed_steps.length === stepCount && next.diagnosis.trim().length >= 80;
    saveProgress.mutate({ ...next, score: Math.min(score, 100), completed });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Interactive Saviynt Hands-on Labs" subtitle="Practise implementation, connector configuration and production-style incident diagnosis. Progress is saved to your learner account." />
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Available scenarios</p><p className="mt-1 text-2xl font-semibold">{labs.length}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Completed labs</p><p className="mt-1 text-2xl font-semibold">{completedCount}</p></div>
        <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Accumulated score</p><p className="mt-1 text-2xl font-semibold">{totalScore}</p></div>
      </div>

      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold">Guided troubleshooting scenarios</h2><p className="text-sm text-muted-foreground">Complete the investigation checklist and document your diagnosis to earn a score.</p></div>
        {isLoading && <p className="text-sm text-muted-foreground">Loading labs…</p>}
        {!isLoading && labs.length === 0 && <p className="rounded-xl border p-5 text-sm text-muted-foreground">No published labs are available yet. Ask your portal administrator to publish lab scenarios.</p>}
        {labs.map((lab) => {
          const saved = progressByLab[lab.id] ?? { lab_id: lab.id, completed_steps: [], diagnosis: "", score: 0, completed: false };
          const expanded = open === lab.id;
          return (
            <article key={lab.id} className="rounded-xl border bg-card p-5 shadow-card">
              <button className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setOpen(expanded ? null : lab.id)} aria-expanded={expanded}>
                <span><span className="font-semibold">{lab.title}</span><span className="mt-1 block text-sm text-muted-foreground">{lab.symptom}</span></span>
                <span className="flex shrink-0 items-center gap-2">{saved.completed && <Badge><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge>}<Badge variant="secondary">{lab.area}</Badge><Badge variant="outline">{lab.difficulty}</Badge>{expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</span>
              </button>
              {expanded && <div className="mt-5 space-y-5 border-t pt-5">
                <div><h3 className="font-medium">Investigation checklist</h3><p className="mb-3 text-xs text-muted-foreground">Tick each action after you have completed or reasoned through it.</p>
                  {lab.steps.length ? <ol className="space-y-2">{lab.steps.map((step, index) => <li key={index} className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={saved.completed_steps.includes(step)} onChange={(event) => { const next = event.target.checked ? [...saved.completed_steps, step] : saved.completed_steps.filter((item) => item !== step); update(lab, { completed_steps: next }); }} /><span>{step}</span></li>)}</ol> : <p className="text-sm text-muted-foreground">No checklist steps have been configured for this scenario.</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowHint((state) => ({ ...state, [lab.id]: !state[lab.id] }))}><Lightbulb className="mr-2 h-4 w-4" />{showHint[lab.id] ? "Hide hint" : "Show hint"}</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowSolution((state) => ({ ...state, [lab.id]: !state[lab.id] }))}>{showSolution[lab.id] ? "Hide solution" : "Reveal solution"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => update(lab, { completed_steps: [], diagnosis: "" })}><RotateCcw className="mr-2 h-4 w-4" />Reset progress</Button>
                </div>
                {showHint[lab.id] && <div className="rounded-lg bg-muted p-3 text-sm"><p className="mb-1 font-medium">Investigation hint</p>{hintFor(lab.area)}</div>}
                <div><label className="mb-2 block text-sm font-medium" htmlFor={`diagnosis-${lab.id}`}>Your diagnosis and remediation plan</label><Textarea id={`diagnosis-${lab.id}`} rows={5} placeholder="Document the evidence you would collect, likely root cause, corrective action and validation steps…" value={diagnosisDraft[lab.id] ?? saved.diagnosis} onChange={(event) => setDiagnosisDraft((state) => ({ ...state, [lab.id]: event.target.value }))} /></div>
                {showSolution[lab.id] && <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm"><p><strong>Root cause:</strong> {lab.root_cause}</p><p><strong>Recommended fix:</strong> {lab.fix}</p></div>}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div className="text-sm"><span className="font-semibold">Score: {saved.score}/100</span><span className="ml-2 text-muted-foreground">{saved.completed ? "Lab completed" : "Complete checklist + write an 80-character diagnosis to finish"}</span></div><Button size="sm" onClick={() => { update(lab, { diagnosis: diagnosisDraft[lab.id] ?? saved.diagnosis }); setDiagnosisDraft((state) => { const next = { ...state }; delete next[lab.id]; return next; }); }} disabled={saveProgress.isPending}>Save progress</Button></div>
              </div>}
            </article>
          );
        })}
      </section>

      <section className="space-y-3">
        <div><h2 className="text-lg font-semibold">Technical practice stations</h2><p className="text-sm text-muted-foreground">Structured exercises for SQL, connector JSON and incident triage. These exercises are self-reviewed and do not require AI calls.</p></div>
        {PRACTICE.map((item) => <article key={item.title} className="rounded-xl border bg-card p-4"><button className="flex w-full items-center justify-between text-left" onClick={() => setPracticeOpen(practiceOpen === item.title ? null : item.title)}><span><span className="font-medium">{item.title}</span><span className="block text-xs text-muted-foreground">{item.area}</span></span>{practiceOpen === item.title ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>{practiceOpen === item.title && <div className="mt-3 space-y-3"><p className="text-sm">{item.prompt}</p><Textarea rows={4} placeholder="Write your approach here…" value={practiceAnswers[item.title] ?? ""} onChange={(event) => setPracticeAnswers((state) => ({ ...state, [item.title]: event.target.value }))} /><details className="rounded-lg bg-muted p-3 text-sm"><summary className="cursor-pointer font-medium">Show guidance</summary><p className="mt-2">{item.hint}</p></details></div>}</article>)}
      </section>
      <div className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground"><Trophy className="h-4 w-4 shrink-0" />Scores reflect checklist completion and the presence of a written diagnosis, not an AI assessment of technical correctness. Use fictional data only; never enter client names, credentials or confidential production information.</div>
    </div>
  );
}

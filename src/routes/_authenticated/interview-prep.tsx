import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Lightbulb, Play, RotateCcw, Trophy } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/interview-prep")({
  head: () => ({ meta: [{ title: "Saviynt Interview Question Bank — Sarath IGA Learning Portal" }] }),
  component: InterviewPrep,
});

type Question = {
  id: string;
  topic: string;
  round: string;
  level: string;
  prompt: string;
  keyPoints: string[];
  sampleAnswer: string;
};

const QUESTIONS: Question[] = [
  {
    id: "eic-01", topic: "Saviynt EIC fundamentals", round: "Technical", level: "Mid-level",
    prompt: "Explain the end-to-end identity lifecycle in Saviynt EIC, from authoritative source aggregation through account provisioning and deprovisioning.",
    keyPoints: ["Authoritative source and identity correlation", "Identity attributes and lifecycle events", "Access request or birthright assignment", "Provisioning workflow and connector task", "Reconciliation, audit evidence and deprovisioning"],
    sampleAnswer: "Describe the source system and aggregation schedule, how records correlate to identities, and which attributes drive lifecycle events. Explain how birthright or requested access is evaluated, how workflows create provisioning tasks, how the target connector executes them, and how aggregation/reconciliation confirms the result. Include termination handling and audit evidence."
  },
  {
    id: "eic-02", topic: "Saviynt EIC fundamentals", round: "Technical", level: "Senior",
    prompt: "An identity is created in Saviynt but receives no expected birthright access. How would you troubleshoot it?",
    keyPoints: ["Verify identity attributes and lifecycle status", "Inspect role/rule eligibility and conditions", "Check job/workflow execution and task status", "Validate endpoint/account mapping", "Confirm provisioning result and re-aggregation"],
    sampleAnswer: "First confirm the identity is active and its source attributes are correct. Evaluate the birthright rule or role criteria against the actual identity values, then inspect the relevant job, workflow and provisioning task logs. Verify the endpoint, account mapping and connector response. Finally aggregate the target account and confirm the access is correlated to the intended identity."
  },
  {
    id: "connect-01", topic: "Connectors & integrations", round: "Scenario-based", level: "Senior",
    prompt: "An AD account create task fails intermittently with an LDAP connection timeout. What evidence and checks would you collect before changing the connector?",
    keyPoints: ["Timestamp, task ID and exact exception", "DNS, route, firewall and LDAPS port reachability", "Domain controller health and certificate trust", "Bind account status and permissions", "Connector logs, retry pattern and controlled retest"],
    sampleAnswer: "Correlate each failure with its task ID and timestamp. Test name resolution and network reachability from the connector execution environment to the configured domain controller and LDAPS port. Validate certificate trust, domain controller availability and bind account health/permissions. Compare successful and failed attempts, review connector logs, then perform a controlled retry after isolating the failing layer."
  },
  {
    id: "connect-02", topic: "Connectors & integrations", round: "Technical", level: "Mid-level",
    prompt: "When onboarding a REST application, what are the critical connector design and validation considerations?",
    keyPoints: ["Authentication and token lifecycle", "HTTP methods, headers and pagination", "Response schema and attribute mapping", "Unique account correlation key", "Rate limits, error handling and reconciliation"],
    sampleAnswer: "Confirm the API authentication flow, token endpoint, scopes and token refresh behaviour. Define the resource URLs, methods, headers and pagination strategy. Inspect representative responses before configuring JSON paths and attribute mappings. Select a stable unique account key for correlation, handle nulls and status values, and test rate limits, error responses and full reconciliation."
  },
  {
    id: "connect-03", topic: "Connectors & integrations", round: "Scenario-based", level: "Senior",
    prompt: "A JDBC aggregation completes without a job-level error, but the imported account count is much lower than the source count. How do you investigate?",
    keyPoints: ["Compare source and connector-side row counts", "Review query predicates and joins", "Check pagination/fetch limits and permissions", "Inspect rejected rows and mapping/correlation", "Validate with a controlled query and sample records"],
    sampleAnswer: "Establish expected source counts using a read-only source query, then compare fetched, processed, rejected and correlated counts in the aggregation evidence. Review WHERE clauses, joins, incremental watermarks, fetch limits and service-account permissions. Inspect representative missing records for null or malformed mapped attributes, then correct the root cause and rerun a controlled aggregation."
  },
  {
    id: "workflow-01", topic: "Workflows & access requests", round: "Technical", level: "Mid-level",
    prompt: "Walk through how you would troubleshoot an access request that remains pending at an approval step.",
    keyPoints: ["Request state and approval history", "Workflow conditions and approver resolution", "Manager/delegate data quality", "Notification and escalation configuration", "Workflow logs and safe request retest"],
    sampleAnswer: "Inspect the request details and approval history to identify the exact pending node. Validate the workflow condition, approver-resolution logic, manager or owner data, delegation and escalation settings. Check workflow execution logs and notification delivery separately. Correct the underlying data or configuration and retest with a controlled request."
  },
  {
    id: "workflow-02", topic: "Workflows & access requests", round: "Scenario-based", level: "Senior",
    prompt: "A user is terminated, but one application account remains active. Explain the investigation and remediation path.",
    keyPoints: ["Termination event and identity status", "Access removal policy and task generation", "Endpoint/account correlation", "Connector execution and target response", "Reconciliation, exception handling and audit trail"],
    sampleAnswer: "Verify that the termination event was received and the identity lifecycle state changed as expected. Confirm the applicable access-removal policy generated a task for the application account. Check whether the account is correctly correlated, inspect the provisioning task and connector response, and verify target-side status. Re-aggregate to confirm removal and document any exception or manual remediation."
  },
  {
    id: "cert-01", topic: "Certifications & governance", round: "Technical", level: "Mid-level",
    prompt: "Explain an access certification campaign lifecycle and the controls you would validate before launch.",
    keyPoints: ["Campaign scope and population", "Reviewer and ownership mapping", "Entitlement/account context and risk data", "Due dates, reminders and escalation", "Revocation execution and campaign closure evidence"],
    sampleAnswer: "Define the campaign population, scope, schedule and reviewer model. Validate that identities, accounts, entitlements, owners and risk context are accurate. Confirm reviewer assignment, delegation, reminders, escalation and revocation workflow behaviour. Pilot the campaign, monitor decisions and revocations, and retain closure evidence."
  },
  {
    id: "sod-01", topic: "RBAC & SoD", round: "Scenario-based", level: "Senior",
    prompt: "A user requests two entitlements that create a segregation-of-duties conflict. How should a preventive control behave, and what would you validate?",
    keyPoints: ["Correctly modelled conflicting entitlement rules", "Request-time policy evaluation", "Risk severity and violation details", "Mitigation/exception approval where permitted", "Evidence that conflicting access was not provisioned"],
    sampleAnswer: "The policy should evaluate the requested access against the user's existing and requested entitlements before provisioning. Validate the rule definitions, entitlement mappings, risk severity and evaluation timing. If the conflict is real, block or route it through an approved mitigation/exception process according to policy. Confirm no conflicting access was provisioned and retain the decision evidence."
  },
  {
    id: "sql-01", topic: "Saviynt SQL & analytics", round: "Technical", level: "Senior",
    prompt: "How would you design an analytics query to find active identities with accounts that are not correlated to an identity?",
    keyPoints: ["Confirm tenant schema and relationship keys", "Use appropriate LEFT JOIN semantics", "Filter for missing identity-side key", "Avoid duplicate rows and validate cardinality", "Test with known positive and negative examples"],
    sampleAnswer: "Start with the account population and LEFT JOIN to the tenant's account-to-identity relationship using the documented key. Filter for rows where the identity-side key is NULL, while applying the required active-account and active-identity criteria. Confirm the actual schema and join cardinality, avoid unnecessary one-to-many joins, and validate the output against known correlated and uncorrelated examples. Table names vary by platform/version, so verify them in the tenant."
  },
  {
    id: "sql-02", topic: "Saviynt SQL & analytics", round: "Scenario-based", level: "Senior",
    prompt: "An analytics report returns duplicate rows after joining users, accounts and entitlements. How do you identify and fix the cause without hiding valid data?",
    keyPoints: ["Inspect relationship cardinality at each join", "Identify one-to-many and many-to-many joins", "Use correct keys and intended report grain", "Aggregate or use EXISTS where appropriate", "Validate totals against source populations"],
    sampleAnswer: "Define the intended grain first, such as one row per identity-account or identity-entitlement. Check row counts after each join to locate where cardinality expands. Correct incomplete join predicates and use aggregation or EXISTS when the report only needs presence. Avoid DISTINCT as a blanket fix because it can conceal legitimate relationships. Reconcile the final totals to known source counts."
  },
  {
    id: "arch-01", topic: "Architecture & operations", round: "Managerial", level: "Senior",
    prompt: "You are planning a production rollout for a new Saviynt application integration. What would your implementation and go-live checklist contain?",
    keyPoints: ["Requirements, ownership and source/target design", "Connectivity, service accounts and security review", "Attribute mapping, correlation and lifecycle use cases", "Positive/negative testing and operational monitoring", "Rollback, runbook, support handover and sign-off"],
    sampleAnswer: "Baseline requirements, owners, data flows and lifecycle use cases. Complete security and connectivity reviews, configure least-privilege service accounts, mappings and correlation. Test aggregation, provisioning, modification, disablement, failures and reconciliation using controlled test identities. Agree monitoring, alerting, rollback, runbook, support ownership and business sign-off before go-live."
  },
  {
    id: "arch-02", topic: "Architecture & operations", round: "Managerial", level: "Senior",
    prompt: "A critical provisioning incident affects multiple applications. How do you coordinate technical recovery while preserving auditability?",
    keyPoints: ["Establish impact, scope and incident timeline", "Contain unsafe or repeated provisioning", "Coordinate app owners and incident management", "Use evidence-led remediation and controlled retries", "Validate outcomes and document RCA/prevention"],
    sampleAnswer: "Establish the affected identities, applications, operations and time window. Coordinate through the incident process and preserve logs and task identifiers. Contain repeated or unsafe retries where appropriate, engage application owners, and isolate whether the issue is platform, connector, network or target-side. Apply a controlled remediation, validate target state and reconciliation, then document root cause, impact, approvals and preventive actions."
  },
];

const TOPICS = ["All topics", ...Array.from(new Set(QUESTIONS.map((q) => q.topic)))];
const ROUNDS = ["All rounds", "Technical", "Scenario-based", "Managerial"];
const LEVELS = ["Mid-level (3–5 years)", "Senior (5+ years)", "Architect"];
const RATINGS = [
  { value: 0, label: "Not covered" },
  { value: 1, label: "Limited" },
  { value: 2, label: "Partial" },
  { value: 3, label: "Good" },
  { value: 4, label: "Strong" },
];

type AttemptAnswer = { questionId: string; question: string; answer: string; rating: number | null; topic: string; keyPoints: string[] };

function InterviewPrep() {
  const [topic, setTopic] = useState(TOPICS[0]!);
  const [round, setRound] = useState(ROUNDS[0]!);
  const [level, setLevel] = useState(LEVELS[0]!);
  const [session, setSession] = useState<Question[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answer: string; rating: number | null }>>({});
  const [reveal, setReveal] = useState<Record<string, boolean>>({});
  const [report, setReport] = useState<{ score: number; count: number; strengths: string[]; gaps: string[] } | null>(null);
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ["interview-prep-user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user;
    },
  });
  const userId = userData?.id;
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["interview-prep-history", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase.from("interviews").select("id,topic,level,score,feedback,created_at").eq("user_id", userId!).order("created_at", { ascending: false }).limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveAttempt = useMutation({
    mutationFn: async (payload: { topic: string; level: string; transcript: AttemptAnswer[]; score: number; feedback: string }) => {
      if (!userId) throw new Error("Please sign in again before saving your interview.");
      const { error } = await supabase.from("interviews").insert({
        user_id: userId,
        topic: payload.topic,
        level: payload.level,
        score: payload.score,
        feedback: payload.feedback,
        transcript: payload.transcript,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["interview-prep-history", userId] }),
    onError: (error) => toast.error(error.message || "Unable to save interview attempt."),
  });

  const currentQuestion = session?.[current];
  const filteredCount = useMemo(() => QUESTIONS.filter((q) => (topic === "All topics" || q.topic === topic) && (round === "All rounds" || q.round === round)).length, [topic, round]);

  function startSession() {
    const selected = QUESTIONS.filter((q) => (topic === "All topics" || q.topic === topic) && (round === "All rounds" || q.round === round));
    if (!selected.length) {
      toast.error("No questions match this combination. Choose another topic or round.");
      return;
    }
    setSession(selected);
    setCurrent(0);
    setAnswers({});
    setReveal({});
    setReport(null);
  }

  function updateAnswer(questionId: string, changes: Partial<{ answer: string; rating: number | null }>) {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: { answer: previous[questionId]?.answer ?? "", rating: previous[questionId]?.rating ?? null, ...changes },
    }));
  }

  function finishSession() {
    if (!session?.length) return;
    const missing = session.filter((q) => !(answers[q.id]?.answer ?? "").trim() || answers[q.id]?.rating == null);
    if (missing.length) {
      toast.error(`Answer and self-rate all questions first. ${missing.length} remaining.`);
      return;
    }
    const transcript: AttemptAnswer[] = session.map((q) => ({
      questionId: q.id, question: q.prompt, answer: answers[q.id]!.answer,
      rating: answers[q.id]!.rating, topic: q.topic, keyPoints: q.keyPoints,
    }));
    const ratings = transcript.map((item) => item.rating ?? 0);
    const score = Math.round((ratings.reduce((sum, value) => sum + value, 0) / (ratings.length * 4)) * 100);
    const strengths = transcript.filter((item) => (item.rating ?? 0) >= 3).map((item) => item.topic);
    const gaps = transcript.filter((item) => (item.rating ?? 0) <= 1).map((item) => item.question);
    const feedback = `Self-assessment score: ${score}/100. This score is based on your own ratings, not an AI or independent correctness evaluation. Strong areas: ${strengths.length ? [...new Set(strengths)].join(", ") : "None identified yet"}. Review areas: ${gaps.length ? gaps.join(" | ") : "Continue practising depth, examples and evidence"}.`;
    setReport({ score, count: transcript.length, strengths: [...new Set(strengths)], gaps });
    saveAttempt.mutate({ topic: topic === "All topics" ? "Saviynt interview question bank" : topic, level, transcript, score, feedback });
  }

  if (report) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader title="Interview practice report" subtitle="Your attempt has been assessed using your self-ratings." />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Self-assessment score</p><p className="mt-1 text-3xl font-semibold">{report.score}/100</p></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Questions completed</p><p className="mt-1 text-3xl font-semibold">{report.count}</p></div>
          <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Strong topic areas</p><p className="mt-1 text-3xl font-semibold">{report.strengths.length}</p></div>
        </div>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Review your performance</h2>
          <p className="text-sm text-muted-foreground">Strong areas: {report.strengths.length ? report.strengths.join(", ") : "No strong areas self-identified. Revisit the guidance and retry."}</p>
          <p className="text-sm text-muted-foreground">Questions to revisit: {report.gaps.length}</p>
          {report.gaps.map((item) => <p key={item} className="rounded-md bg-muted p-3 text-sm">{item}</p>)}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => { setSession(null); setReport(null); setAnswers({}); }}>Start another practice</Button>
            <Button variant="outline" onClick={() => { setSession(null); setReport(null); }}>Back to question bank</Button>
          </div>
        </div>
      </div>
    );
  }

  if (session && currentQuestion) {
    const answer = answers[currentQuestion.id] ?? { answer: "", rating: null };
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <PageHeader title="Saviynt interview practice" subtitle={`${level} · ${currentQuestion.round} · ${currentQuestion.topic}`} action={<Button variant="outline" onClick={() => { setSession(null); setAnswers({}); setCurrent(0); }}>Exit session</Button>} />
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>Question {current + 1} of {session.length}</span>
          <Badge variant="secondary">{Math.round(((current + 1) / session.length) * 100)}% through</Badge>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((current + 1) / session.length) * 100}%` }} /></div>
        <section className="rounded-xl border bg-card p-5 md:p-7 space-y-5">
          <div className="flex flex-wrap gap-2"><Badge>{currentQuestion.topic}</Badge><Badge variant="outline">{currentQuestion.level}</Badge></div>
          <h2 className="text-lg font-semibold leading-relaxed">{currentQuestion.prompt}</h2>
          <div>
            <label className="mb-2 block text-sm font-medium" htmlFor="interview-answer">Your answer</label>
            <Textarea id="interview-answer" rows={7} value={answer.answer} onChange={(event) => updateAnswer(currentQuestion.id, { answer: event.target.value })} placeholder="Structure your response: context, investigation, evidence, corrective action and validation…" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Self-assess how completely you covered the expected points</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {RATINGS.map((rating) => <Button key={rating.value} size="sm" variant={answer.rating === rating.value ? "default" : "outline"} onClick={() => updateAnswer(currentQuestion.id, { rating: rating.value })}>{rating.value} · {rating.label}</Button>)}
            </div>
            <p className="text-xs text-muted-foreground">0 = not covered · 4 = strong, complete explanation. This is a self-rating, not automated answer grading.</p>
          </div>
          <div className="rounded-lg border p-3">
            <button className="flex w-full items-center gap-2 text-left text-sm font-medium" onClick={() => setReveal((previous) => ({ ...previous, [currentQuestion.id]: !previous[currentQuestion.id] }))}>
              <Lightbulb className="h-4 w-4" /> {reveal[currentQuestion.id] ? "Hide expected answer points" : "Show expected answer points"}
            </button>
            {reveal[currentQuestion.id] && <div className="mt-3 space-y-3 text-sm"><ul className="list-disc space-y-1 pl-5">{currentQuestion.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul><p className="rounded-md bg-muted p-3">{currentQuestion.sampleAnswer}</p></div>}
          </div>
          <div className="flex items-center justify-between gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0}><ChevronLeft className="mr-1 h-4 w-4" />Previous</Button>
            {current < session.length - 1 ? <Button onClick={() => setCurrent((value) => Math.min(session.length - 1, value + 1))}>Next question<ChevronRight className="ml-1 h-4 w-4" /></Button> : <Button onClick={finishSession} disabled={saveAttempt.isPending}>{saveAttempt.isPending ? "Saving…" : "Finish and save attempt"}<CheckCircle2 className="ml-2 h-4 w-4" /></Button>}
          </div>
          {current === session.length - 1 && <p className="text-xs text-muted-foreground">All questions must have an answer and a self-rating before the attempt can be saved.</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <PageHeader title="Saviynt Interview Question Bank" subtitle="Practise technical, scenario-based and managerial questions for Saviynt implementation and support roles." />
      <section className="grid gap-4 rounded-xl border bg-card p-5 shadow-card md:grid-cols-3">
        <label className="text-sm">Topic
          <select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={topic} onChange={(event) => setTopic(event.target.value)}>{TOPICS.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <label className="text-sm">Interview round
          <select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={round} onChange={(event) => setRound(event.target.value)}>{ROUNDS.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <label className="text-sm">Experience level
          <select className="mt-1 h-10 w-full rounded-md border bg-background px-3" value={level} onChange={(event) => setLevel(event.target.value)}>{LEVELS.map((item) => <option key={item}>{item}</option>)}</select>
        </label>
        <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-3">
          <p className="text-sm text-muted-foreground">{filteredCount} questions match your selection. Attempts are saved to your learner account.</p>
          <Button onClick={startSession} disabled={filteredCount === 0}><Play className="mr-2 h-4 w-4" />Start practice</Button>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /><h2 className="text-lg font-semibold">Question bank coverage</h2></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.slice(1).map((item) => <div key={item} className="rounded-lg border bg-card p-4"><p className="font-medium">{item}</p><p className="mt-1 text-sm text-muted-foreground">{QUESTIONS.filter((q) => q.topic === item).length} practice questions</p></div>)}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5" /><h2 className="text-lg font-semibold">Recent attempts</h2></div>
        {historyLoading ? <p className="text-sm text-muted-foreground">Loading interview history…</p> : history.length ? <div className="divide-y rounded-xl border bg-card">{history.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{item.topic}</p><p className="text-xs text-muted-foreground">{item.level} · {new Date(item.created_at).toLocaleDateString()}</p><p className="mt-1 max-w-2xl text-xs text-muted-foreground">{item.feedback}</p></div><Badge variant="secondary">{item.score ?? "—"}/100</Badge></div>)}</div> : <p className="rounded-lg border p-4 text-sm text-muted-foreground">No saved attempts yet. Complete a practice session to build your interview history.</p>}
      </section>
      <div className="flex items-start gap-2 rounded-lg border p-3 text-xs text-muted-foreground"><RotateCcw className="h-4 w-4 shrink-0" />This question bank works without AI calls or additional API credits. Scores are learner self-assessments; use the expected points and sample answers to review your responses critically.</div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, Award, MessagesSquare, Database, Bot, PlayCircle, Flame, Target, CheckCircle2, ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useProfile } from "@/hooks/use-auth";
import { computeStats, useActivity } from "@/lib/stats";
import { Progress } from "@/components/ui/progress";
import { ALL_LESSONS, MODULES } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — IGA Academy AI" }, { name: "description", content: "Your learning progress." }] }),
  component: Dashboard,
});

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Flame; label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ChartCard({ title, children, empty }: { title: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {empty ? <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">No activity yet</p> : <div className="h-48">{children}</div>}
    </div>
  );
}

function Dashboard() {
  const { data: profile } = useProfile();
  const { data, isLoading } = useActivity();
  if (isLoading || !data) return <p className="text-muted-foreground">Loading…</p>;
  const s = computeStats(data);
  const recent = [
    ...data.progress.map((p) => ({ at: p.completed_at, text: `Completed “${ALL_LESSONS.find((l) => l.id === p.lesson_id)?.title ?? p.lesson_id}”` })),
    ...data.attempts.map((a) => ({ at: a.created_at, text: `${a.is_certification ? "Practice exam" : `Quiz ${MODULES.find((m) => m.id === a.module_id)?.title ?? ""}`}: ${a.score}/${a.total}` })),
    ...data.interviews.map((i) => ({ at: i.created_at, text: `Mock interview: ${i.topic}${i.score != null ? ` — ${i.score}/100` : ""}` })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 6);

  const cards = [
    { to: "/learn", icon: PlayCircle, title: "Continue Learning", text: s.next[0]?.title ?? "All lessons complete" },
    { to: "/learn", icon: BookOpen, title: "Saviynt Training", text: "11 structured modules" },
    { to: "/interview", icon: MessagesSquare, title: "Interview Preparation", text: "Adaptive AI interviewer" },
    { to: "/certification", icon: Award, title: "Certification Prep", text: "Timed practice exams" },
    { to: "/sql", icon: Database, title: "SQL Practice", text: "Hands-on queries with feedback" },
    { to: "/tutor", icon: Bot, title: "AI Tutor", text: "Ask anything about Saviynt" },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back${profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}`} subtitle={`${profile?.experience_level ?? ""} · Keep building your IGA expertise.`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat icon={BookOpen} label="Modules started" value={`${s.modulesStarted}/${MODULES.length}`} hint={`${s.modulesDone} completed`} />
        <Stat icon={Target} label="Overall progress" value={`${s.pct}%`} hint={`${s.done.size}/${ALL_LESSONS.length} lessons`} />
        <Stat icon={ClipboardList} label="Quizzes attempted" value={data.attempts.length} hint={`Avg score ${s.avg}%`} />
        <Stat icon={Flame} label="Learning streak" value={`${s.streak} day${s.streak === 1 ? "" : "s"}`} />
        <Stat icon={Award} label="Best practice exam" value={`${s.bestCert}%`} hint="Pass mark 70%" />
        <Stat icon={MessagesSquare} label="Mock interviews" value={s.completedInterviews.length} />
        <div className="col-span-2 rounded-xl border bg-card p-4 shadow-card">
          <p className="text-xs text-muted-foreground">Certification readiness</p>
          <Progress value={Math.round(s.pct * 0.5 + s.bestCert * 0.5)} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">Based on lesson completion and your best practice exam.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.title} to={c.to} className="card-lift flex items-start gap-3 rounded-xl border bg-card p-4 shadow-card">
            <span className="rounded-lg bg-accent p-2 text-accent-foreground"><c.icon className="h-5 w-5" /></span>
            <span><span className="block font-medium">{c.title}</span><span className="text-sm text-muted-foreground">{c.text}</span></span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Weekly learning activity" empty={!s.weekly.some((w) => w.lessons || w.quizzes)}>
          <ResponsiveContainer><BarChart data={s.weekly}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="lessons" fill="var(--chart-1)" radius={4} /><Bar dataKey="quizzes" fill="var(--chart-2)" radius={4} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Topic-wise assessment performance (%)" empty={!s.topic.some((t) => t.score != null)}>
          <ResponsiveContainer><BarChart data={s.topic}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="module" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="score" fill="var(--chart-3)" radius={4} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Course completion by module (%)" empty={s.done.size === 0}>
          <ResponsiveContainer><BarChart data={s.completion}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="module" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="pct" fill="var(--chart-5)" radius={4} /></BarChart></ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Interview performance over time" empty={s.interviewTrend.length === 0}>
          <ResponsiveContainer><LineChart data={s.interviewTrend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="n" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Line dataKey="score" stroke="var(--chart-1)" strokeWidth={2} /></LineChart></ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold">Recommended next lessons</h3>
          <ul className="space-y-2">
            {s.next.map((l) => (
              <li key={l.id}><Link to="/learn/$moduleId" params={{ moduleId: l.moduleId }} className="text-sm text-primary hover:underline">{l.title}</Link></li>
            ))}
            {s.next.length === 0 && <li className="text-sm text-muted-foreground">You've completed every lesson 🎉</li>}
          </ul>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold">Recent activity</h3>
          <ul className="space-y-2">
            {recent.map((r, k) => (
              <li key={k} className="flex items-start gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /><span>{r.text}<span className="ml-2 text-xs text-muted-foreground">{new Date(r.at).toLocaleDateString()}</span></span></li>
            ))}
            {recent.length === 0 && <li className="text-sm text-muted-foreground">Start a lesson to see your activity here.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

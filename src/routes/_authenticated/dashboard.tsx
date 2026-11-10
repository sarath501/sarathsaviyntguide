import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  BookOpen, Award, MessagesSquare, Database, PlayCircle, Flame, Target, CheckCircle2,
  ClipboardList, Wrench, Plug, ArrowRight, Sparkles, TrendingUp, Clock3, Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useProfile } from "@/hooks/use-auth";
import { computeStats, useActivity } from "@/lib/stats";
import { Progress } from "@/components/ui/progress";
import { useCurriculum } from "@/lib/curriculum";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Sarath IGA Learning Portal" }, { name: "description", content: "Your learning progress, recommended activities and next steps." }] }),
  component: Dashboard,
});

const QUICK_LINKS = [
  { to: "/learn", icon: BookOpen, title: "Learning Center", description: "Explore Saviynt lessons", tag: "LEARN", tone: "bg-blue-500/10 text-blue-600" },
  { to: "/certification", icon: Award, title: "Certification Prep", description: "Take a practice exam", tag: "ASSESS", tone: "bg-amber-500/10 text-amber-600" },
  { to: "/labs", icon: Wrench, title: "Troubleshooting Labs", description: "Solve real-world scenarios", tag: "PRACTISE", tone: "bg-emerald-500/10 text-emerald-600" },
  { to: "/connectors", icon: Plug, title: "Connector Guides", description: "Learn integrations", tag: "EXPLORE", tone: "bg-violet-500/10 text-violet-600" },
  { to: "/sql", icon: Database, title: "SQL Practice", description: "Build query skills", tag: "PRACTISE", tone: "bg-cyan-500/10 text-cyan-600" },
  { to: "/interview-prep", icon: MessagesSquare, title: "Interview Question Bank", description: "Prepare for interviews", tag: "PREPARE", tone: "bg-rose-500/10 text-rose-600" },
] as const;

function StatCard({ to, icon: Icon, label, value, hint }: {
  to: "/learn" | "/certification" | "/interview-prep";
  icon: typeof Flame; label: string; value: string | number; hint: string;
}) {
  return (
    <Link to={to} className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-0.5 text-sm font-medium">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </Link>
  );
}

function ChartCard({ title, subtitle, children, empty }: { title: string; subtitle: string; children: React.ReactNode; empty?: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs text-muted-foreground">{subtitle}</p></div>
      {empty ? <div className="flex h-48 flex-col items-center justify-center text-center"><TrendingUp className="h-7 w-7 text-muted-foreground/50" /><p className="mt-2 text-sm text-muted-foreground">No data yet</p><p className="text-xs text-muted-foreground">Complete a lesson or assessment to see your progress here.</p></div> : <div className="h-48">{children}</div>}
    </div>
  );
}

function Dashboard() {
  const { data: profile } = useProfile();
  const { data, isLoading, error } = useActivity();
  const { data: cur } = useCurriculum();

  if (isLoading || !data || !cur) return <div className="space-y-4" role="status"><div className="h-36 animate-pulse rounded-2xl bg-muted" /><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[1,2,3,4].map((n) => <div key={n} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div><p className="text-sm text-muted-foreground">Preparing your learning dashboard…</p></div>;
  if (error) return <div className="rounded-xl border border-destructive/40 p-6"><h2 className="font-semibold">We couldn’t load your dashboard</h2><p className="mt-1 text-sm text-muted-foreground">Refresh the page. Your learning records have not been changed.</p></div>;

  const s = computeStats(data, cur);
  const recent = [
    ...data.progress.map((p) => ({ at: p.completed_at, text: `Completed “${cur.lessons.find((l) => l.id === p.lesson_id)?.title ?? p.lesson_id}”`, to: "/learn" as const })),
    ...data.attempts.map((a) => ({ at: a.created_at, text: `${a.is_certification ? "Practice exam" : `Quiz ${cur.modules.find((m) => m.id === a.module_id)?.title ?? ""}`}: ${a.score}/${a.total}`, to: "/certification" as const })),
    ...data.interviews.map((i) => ({ at: i.created_at, text: `Mock interview: ${i.topic}${i.score != null ? ` — ${i.score}/100` : ""}`, to: "/interview-prep" as const })),
  ].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 5);

  const lastLesson = profile?.last_lesson_id ? cur.lessons.find((l) => l.id === profile.last_lesson_id) : undefined;
  const nextLesson = s.next[0];
  const resumeLesson = lastLesson ?? nextLesson;
  const progressValue = Math.round(s.pct * 0.5 + s.bestCert * 0.5);

  return (
    <div className="space-y-9 animate-in fade-in-50 duration-500">
      <section className="relative overflow-hidden rounded-[2rem] bg-hero p-6 text-navy-foreground shadow-xl ring-1 ring-white/10 md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[34px] border-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative grid gap-7 md:grid-cols-[1.35fr_0.65fr] md:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-navy-muted"><Sparkles className="h-3.5 w-3.5" /> YOUR LEARNING SPACE</div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-navy-muted md:text-base">Keep building your Saviynt and Identity Governance skills. Pick up where you left off or explore something new.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {resumeLesson ? <Link to="/lesson/$lessonId" params={{ lessonId: resumeLesson.id }} className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><PlayCircle className="mr-2 h-4 w-4" />Continue learning<ArrowRight className="ml-2 h-4 w-4" /></Link> : <Link to="/learn" className="inline-flex items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:brightness-110"><BookOpen className="mr-2 h-4 w-4" />Start learning<ArrowRight className="ml-2 h-4 w-4" /></Link>}
              <Link to="/plan" className="inline-flex items-center rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-navy-foreground transition hover:bg-white/10">View learning path</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-inner backdrop-blur-md">
            <div className="flex items-center justify-between"><span className="text-sm font-medium">Your learning progress</span><Target className="h-5 w-5 text-navy-muted" /></div>
            <p className="mt-3 text-4xl font-bold tabular-nums">{s.pct}%</p>
            <p className="mt-1 text-xs text-navy-muted">{s.doneCount} of {s.total} lessons completed</p>
            <Progress value={s.pct} className="mt-4 h-2 bg-white/15" />
            <div className="mt-4 flex justify-between gap-2 text-xs text-navy-muted"><span>{s.modulesDone} modules completed</span><span>{cur.modules.length} total modules</span></div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Your learning at a glance</h2><p className="mt-1 text-sm text-muted-foreground">Select any card to open the related section.</p></div></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          <StatCard to="/learn" icon={BookOpen} label="Modules started" value={`${s.modulesStarted}/${cur.modules.length}`} hint={`${s.modulesDone} completed`} />
          <StatCard to="/learn" icon={Target} label="Lessons completed" value={s.doneCount} hint={`of ${s.total} lessons`} />
          <StatCard to="/certification" icon={ClipboardList} label="Quizzes attempted" value={data.attempts.length} hint={`Average score ${s.avg}%`} />
          <StatCard to="/certification" icon={Trophy} label="Best exam score" value={`${s.bestCert}%`} hint="Practice pass mark: 70%" />
          <StatCard to="/interview-prep" icon={Flame} label="Learning streak" value={`${s.streak} day${s.streak === 1 ? "" : "s"}`} hint={`${s.completedInterviews.length} mock interviews completed`} />
        </div>
      </section>

      <section>
        <div className="mb-4"><h2 className="text-xl font-bold">Explore your learning tools</h2><p className="mt-1 text-sm text-muted-foreground">Choose an activity to continue. Every card opens that section.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {QUICK_LINKS.map((item) => (
            <Link key={item.to} to={item.to} className="group flex min-h-32 items-center gap-4 rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${item.tone}`}><item.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-[10px] font-bold tracking-[0.14em] text-muted-foreground">{item.tag}</span><span className="mt-1 block font-semibold">{item.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{item.description}</span></span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4"><h2 className="text-xl font-bold">Your performance</h2><p className="mt-1 text-sm text-muted-foreground">Track learning activity and assessment results over time.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Weekly learning activity" subtitle="Lessons completed and quizzes attempted" empty={!s.weekly.some((w) => w.lessons || w.quizzes)}>
            <ResponsiveContainer><BarChart data={s.weekly}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="day" fontSize={12} /><YAxis allowDecimals={false} fontSize={12} /><Tooltip /><Bar dataKey="lessons" name="Lessons" fill="var(--chart-1)" radius={4} /><Bar dataKey="quizzes" name="Quizzes" fill="var(--chart-2)" radius={4} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Assessment performance" subtitle="Your scores by learning topic" empty={!s.topic.some((t) => t.score != null)}>
            <ResponsiveContainer><BarChart data={s.topic}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="module" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="score" name="Score" fill="var(--chart-3)" radius={4} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Module completion" subtitle="Percentage of lessons completed in each module" empty={s.doneCount === 0}>
            <ResponsiveContainer><BarChart data={s.completion}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="module" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Bar dataKey="pct" name="Completed" fill="var(--chart-5)" radius={4} /></BarChart></ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Interview practice trend" subtitle="Self-assessment scores from completed mock interviews" empty={s.interviewTrend.length === 0}>
            <ResponsiveContainer><LineChart data={s.interviewTrend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="n" fontSize={12} /><YAxis domain={[0, 100]} fontSize={12} /><Tooltip /><Line dataKey="score" name="Score" stroke="var(--chart-1)" strokeWidth={2} /></LineChart></ResponsiveContainer>
          </ChartCard>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Recommended next lessons</h2><p className="mt-1 text-xs text-muted-foreground">Suggested based on your course progress</p></div><BookOpen className="h-5 w-5 text-primary" /></div>
          {s.next.length ? <ul className="space-y-2">{s.next.slice(0, 5).map((lesson) => <li key={lesson.id}><Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-muted"><span>{lesson.title}</span><ArrowRight className="h-4 w-4 shrink-0 text-primary" /></Link></li>)}</ul> : <p className="text-sm text-muted-foreground">You have completed all available lessons. Explore practice exams and labs next.</p>}
          <Link to="/learn" className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline">Browse all lessons <ArrowRight className="ml-1 h-4 w-4" /></Link>
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Recent activity</h2><p className="mt-1 text-xs text-muted-foreground">Your latest learning actions</p></div><Clock3 className="h-5 w-5 text-primary" /></div>
          {recent.length ? <ul className="space-y-1">{recent.map((item, index) => <li key={index}><Link to={item.to} className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm transition hover:bg-muted"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span className="min-w-0 flex-1">{item.text}<span className="ml-2 block text-xs text-muted-foreground">{new Date(item.at).toLocaleDateString()}</span></span><ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" /></Link></li>)}</ul> : <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">Your activity will appear here after you complete a lesson or practice activity. <Link to="/learn" className="font-medium text-primary hover:underline">Start your first lesson</Link>.</div>}
        </div>
      </section>

      <section className="rounded-2xl border bg-muted/30 p-5 md:flex md:items-center md:justify-between md:gap-6">
        <div><p className="font-semibold">Keep your learning momentum going</p><p className="mt-1 text-sm text-muted-foreground">Your readiness indicator combines lesson progress and your best practice exam result. It is not an official certification score.</p><div className="mt-3 flex items-center gap-3"><Progress value={progressValue} className="max-w-xs" /><span className="text-sm font-semibold tabular-nums">{progressValue}%</span></div></div>
        <Link to="/plan" className="mt-4 inline-flex shrink-0 items-center rounded-lg border bg-card px-4 py-2.5 text-sm font-medium shadow-sm transition hover:border-primary/40 hover:text-primary md:mt-0">View my learning path <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </section>
    </div>
  );
}

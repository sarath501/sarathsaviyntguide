import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Flame, Trophy, BookOpen, ClipboardCheck, MessagesSquare, Target, Award, CheckCircle2, LockKeyhole } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useActivity } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/activity")({ component: LearningActivity });

const DAY = 24 * 60 * 60 * 1000;
const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const localDate = (value: string) => {
  const d = new Date(value);
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
};

function LearningActivity() {
  const { data, isLoading, error } = useActivity();

  if (isLoading) return <div className="space-y-4" role="status"><div className="h-10 w-64 animate-pulse rounded bg-muted" /><div className="h-48 animate-pulse rounded-2xl bg-muted" /><p className="text-sm text-muted-foreground">Loading your learning activity…</p></div>;
  if (error || !data) return <div className="rounded-xl border border-destructive/40 p-6"><h2 className="font-semibold">Activity could not be loaded</h2><p className="mt-1 text-sm text-muted-foreground">Refresh the page and try again. Your learning records have not been changed.</p></div>;

  const activityDates = [
    ...data.progress.map(x => x.completed_at),
    ...data.attempts.map(x => x.created_at),
    ...data.interviews.map(x => x.created_at),
  ].map(localDate);
  const counts = new Map<string, number>();
  activityDates.forEach(key => counts.set(key, (counts.get(key) ?? 0) + 1));
  const activeDays = new Set(counts.keys());
  const today = new Date();
  const todayKey = dateKey(today);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!activeDays.has(todayKey)) cursor.setTime(yesterday.getTime());
  let streak = 0;
  while (activeDays.has(dateKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  const longest = (() => {
    const sorted = [...activeDays].sort();
    let best = 0, run = 0, previous = "";
    for (const key of sorted) {
      const current = new Date(`${key}T00:00:00`);
      const prior = previous ? new Date(`${previous}T00:00:00`) : null;
      run = prior && current.getTime() - prior.getTime() === DAY ? run + 1 : 1;
      best = Math.max(best, run);
      previous = key;
    }
    return best;
  })();

  const calendarStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  calendarStart.setDate(calendarStart.getDate() - 83);
  calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
  const calendarDays = Array.from({ length: 84 }, (_, i) => {
    const d = new Date(calendarStart.getTime() + i * DAY);
    const key = dateKey(d);
    return { key, day: d.getDate(), month: d.getMonth(), count: counts.get(key) ?? 0, future: d > today };
  });
  const monthLabels = calendarDays.filter((d, i) => d.day === 1 || i === 0);
  const weekGoal = 5;
  const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weeklyDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * DAY);
    return dateKey(d);
  });
  const weeklyActive = weeklyDays.filter(k => activeDays.has(k)).length;
  const lessons = data.progress.length;
  const quizzes = data.attempts.length;
  const interviews = data.interviews.length;
  const badges = [
    { title: "First Steps", detail: "Complete your first lesson", earned: lessons >= 1, icon: BookOpen },
    { title: "Learning Habit", detail: "Be active on 5 different days", earned: activeDays.size >= 5, icon: CalendarDays },
    { title: "Week in Motion", detail: "Reach a 7-day learning streak", earned: longest >= 7, icon: Flame },
    { title: "Knowledge Check", detail: "Complete 5 quiz attempts", earned: quizzes >= 5, icon: ClipboardCheck },
    { title: "Interview Ready", detail: "Complete 3 mock interviews", earned: interviews >= 3, icon: MessagesSquare },
    { title: "Consistency Champion", detail: "Reach a 30-day learning streak", earned: longest >= 30, icon: Trophy },
  ];
  const earned = badges.filter(x => x.earned).length;

  return <div className="space-y-7">
    <PageHeader title="Learning Activity & Achievements" subtitle="Your learning calendar, consistency streaks and milestones, calculated from activity already saved to your account." />
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border bg-card p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Flame className="h-4 w-4 text-orange-500"/>Current streak</div><p className="mt-2 text-3xl font-bold tabular-nums">{streak} days</p><p className="mt-1 text-xs text-muted-foreground">Consecutive active days</p></div>
      <div className="rounded-2xl border bg-card p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Trophy className="h-4 w-4"/>Longest streak</div><p className="mt-2 text-3xl font-bold tabular-nums">{longest} days</p><p className="mt-1 text-xs text-muted-foreground">Personal best</p></div>
      <div className="rounded-2xl border bg-card p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4"/>Active days</div><p className="mt-2 text-3xl font-bold tabular-nums">{activeDays.size}</p><p className="mt-1 text-xs text-muted-foreground">All recorded activity</p></div>
      <div className="rounded-2xl border bg-card p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Award className="h-4 w-4"/>Achievements</div><p className="mt-2 text-3xl font-bold tabular-nums">{earned}/{badges.length}</p><p className="mt-1 text-xs text-muted-foreground">Milestones unlocked</p></div>
    </section>

    <section className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Your activity calendar</h2><p className="mt-1 text-sm text-muted-foreground">The last 12 weeks. Darker cells indicate more recorded learning activity.</p></div><span className="text-xs text-muted-foreground">{activeDays.size} active days total</span></div>
      <div className="mt-5 overflow-x-auto pb-2">
        <div className="min-w-[620px]">
          <div className="mb-2 grid grid-cols-12 gap-1 text-[10px] text-muted-foreground">{monthLabels.map(m=><span key={m.key} style={{gridColumn: `span ${Math.max(1, Math.ceil((calendarDays.findIndex(x=>x.key===m.key) - (monthLabels[monthLabels.indexOf(m)-1] ? calendarDays.findIndex(x=>x.key===monthLabels[monthLabels.indexOf(m)-1].key) : 0))/7))}`}}>{new Date(`${m.key}T00:00:00`).toLocaleDateString(undefined,{month:"short"})}</span>)}</div>
          <div className="grid grid-flow-col grid-rows-7 gap-1">{calendarDays.map(d=><div key={d.key} title={`${d.key}: ${d.count} recorded activities`} className={`h-4 w-4 rounded-[3px] ${d.future ? "bg-muted/30" : d.count===0 ? "bg-muted" : d.count===1 ? "bg-emerald-200 dark:bg-emerald-900" : d.count<=3 ? "bg-emerald-400 dark:bg-emerald-700" : "bg-emerald-600 dark:bg-emerald-500"}`} />)}</div>
          <div className="mt-3 flex items-center justify-end gap-2 text-[10px] text-muted-foreground"><span>Less</span>{["bg-muted","bg-emerald-200 dark:bg-emerald-900","bg-emerald-400 dark:bg-emerald-700","bg-emerald-600 dark:bg-emerald-500"].map(c=><span key={c} className={`h-3 w-3 rounded-[2px] ${c}`}/ >)}<span>More</span></div>
        </div>
      </div>
    </section>

    <section className="rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2"><Target className="h-5 w-5 text-primary"/><h2 className="font-semibold">This week’s goal</h2></div>
      <p className="mt-1 text-sm text-muted-foreground">Be active on {weekGoal} days this week. A day counts when you complete a lesson, attempt a quiz or record a mock interview.</p>
      <div className="mt-4 flex items-center justify-between text-sm"><span className="font-medium">{weeklyActive} of {weekGoal} active days</span><span className="text-muted-foreground">{Math.min(100,Math.round(weeklyActive/weekGoal*100))}%</span></div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{width:`${Math.min(100,weeklyActive/weekGoal*100)}%`}}/></div>
      <div className="mt-3 flex gap-2">{weeklyDays.map((k,i)=><div key={k} className={`flex-1 rounded-md py-2 text-center text-xs ${activeDays.has(k)?"bg-primary/10 text-primary":"bg-muted text-muted-foreground"}`}><div>{["M","T","W","T","F","S","S"][i]}</div><div className="mt-1">{activeDays.has(k)?"✓":"·"}</div></div>)}</div>
    </section>

    <section><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Achievement badges</h2><p className="mt-1 text-sm text-muted-foreground">Earn milestones through consistent learning and practice.</p></div><span className="text-sm font-medium">{earned} unlocked</span></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{badges.map(b=><div key={b.title} className={`flex items-start gap-3 rounded-xl border p-4 ${b.earned?"bg-primary/5":"bg-card opacity-75"}`}><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${b.earned?"bg-primary/10 text-primary":"bg-muted text-muted-foreground"}`}>{b.earned?<b.icon className="h-5 w-5"/>:<LockKeyhole className="h-5 w-5"/>}</span><div><div className="flex items-center gap-2 text-sm font-semibold">{b.title}{b.earned&&<CheckCircle2 className="h-4 w-4 text-emerald-600"/>}</div><p className="mt-1 text-xs text-muted-foreground">{b.detail}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-wide">{b.earned?"Unlocked":"Not yet earned"}</p></div></div>)}</div>
    </section>
    <p className="text-xs text-muted-foreground">Activity is derived from lesson completions, quiz attempts and mock interview records already associated with your account. Opening a page or browsing content does not count. Calendar and streaks use your browser’s local date. No new records are written and no existing progress is changed.</p>
  </div>;
}

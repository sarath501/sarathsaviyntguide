import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Line, LineChart } from "recharts";
import { RefreshCw, Users, Activity, BookOpen, ClipboardCheck, MessageSquare, Plug, FlaskConical } from "lucide-react";
import { getAdminPlatformAnalytics } from "@/lib/analytics.functions";
import { Button } from "@/components/ui/button";

const card = "rounded-xl border bg-card p-5 shadow-card";

export function AdminAnalytics() {
  const load = useServerFn(getAdminPlatformAnalytics);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-platform-analytics"],
    queryFn: () => load(),
    staleTime: 60_000,
  });
  const totals = data?.totals;
  const metrics = [
    { label: "Registered users", value: totals?.registeredUsers ?? 0, icon: Users },
    { label: "Active learners (30d)", value: totals?.activeLearners30d ?? 0, icon: Activity },
    { label: "Lessons completed", value: totals?.lessonsCompleted ?? 0, icon: BookOpen },
    { label: "Quiz attempts", value: totals?.quizAttempts ?? 0, icon: ClipboardCheck },
    { label: "Average quiz score", value: `${totals?.averageQuizScore ?? 0}%`, icon: ClipboardCheck },
    { label: "Quiz pass rate (70%+)", value: `${totals?.quizPassRate ?? 0}%`, icon: ClipboardCheck },
    { label: "Interview sessions", value: totals?.interviews ?? 0, icon: MessageSquare },
    { label: "Connector progress records", value: totals?.connectorProgressRecords ?? 0, icon: Plug },
  ];
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold">Platform analytics</h2><p className="text-sm text-muted-foreground">Usage and learning activity from recorded portal data.</p></div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh</Button>
      </div>
      {isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading analytics…</p> : isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{(error as Error)?.message ?? "Unable to load analytics."}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((item) => <div key={item.label} className={card}><div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{item.label}</p><item.icon className="h-4 w-4 text-muted-foreground" /></div><p className="mt-2 text-2xl font-semibold tabular-nums">{item.value}</p></div>)}
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <section className={card}>
              <h3 className="mb-1 font-semibold">Registrations by month</h3><p className="mb-4 text-xs text-muted-foreground">Profile creation records · last 12 months</p>
              <div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data?.monthly ?? []}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="registrations" name="Registrations" fill="hsl(var(--primary))" radius={[4,4,0,0]} /></BarChart></ResponsiveContainer></div>
            </section>
            <section className={card}>
              <h3 className="mb-1 font-semibold">Learning activity by month</h3><p className="mb-4 text-xs text-muted-foreground">Recorded lesson completions and quiz attempts · last 12 months</p>
              <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={data?.monthly ?? []}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="lessonCompletions" name="Lesson completions" stroke="hsl(var(--primary))" strokeWidth={2} /><Line type="monotone" dataKey="quizAttempts" name="Quiz attempts" stroke="hsl(var(--chart-2))" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
            </section>
          </div>
          <section className={card}>
            <h3 className="mb-3 font-semibold">Learning content inventory</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[
              { label: "Modules", value: totals?.modules ?? 0, icon: BookOpen },
              { label: "Lessons", value: totals?.lessons ?? 0, icon: BookOpen },
              { label: "Labs", value: totals?.labs ?? 0, icon: FlaskConical },
              { label: "Connectors", value: totals?.connectors ?? 0, icon: Plug },
            ].map((item) => <div key={item.label} className="rounded-lg bg-muted/40 p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><item.icon className="h-4 w-4" />{item.label}</div><p className="mt-2 text-xl font-semibold">{item.value}</p></div>)}</div>
          </section>
          <p className="text-xs text-muted-foreground">Active learner = a distinct user with a recorded lesson completion, quiz attempt, interview, or connector-progress update in the last 30 days. Quiz pass rate uses a 70% threshold. Lab inventory is shown; individual lab completion is not yet tracked.</p>
          <p className="text-xs text-muted-foreground">Last refreshed: {data?.generatedAt ? new Date(data.generatedAt).toLocaleString() : "—"}</p>
        </>
      )}
    </div>
  );
}

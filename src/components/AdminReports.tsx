import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { getAdminUserAnalytics } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type ReportUser = {
  id: string; email: string; fullName: string; experienceLevel: string;
  registeredAt: string; lastLoginAt: string | null; lastActivityAt: string | null;
  emailConfirmedAt: string | null; status: string; lessonsCompleted: number;
  quizAttempts: number; averageQuizScore: number | null; interviews: number;
  connectorsStarted: number;
};

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const dateLabel = (value: string | null) => value ? new Date(value).toLocaleString() : "";

export function AdminReports() {
  const loadUsers = useServerFn(getAdminUserAnalytics);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-reports-users"],
    queryFn: () => loadUsers(),
    staleTime: 30_000,
  });
  const [period, setPeriod] = useState("30");
  const users = (data?.users ?? []) as ReportUser[];
  const cutoff = period === "all" ? 0 : Date.now() - Number(period) * 24 * 60 * 60 * 1000;
  const inPeriod = useMemo(() => users.filter((user) => {
    const activityAt = user.lastActivityAt ? Date.parse(user.lastActivityAt) : Date.parse(user.registeredAt);
    return activityAt >= cutoff;
  }), [users, cutoff]);
  const verified = users.filter((user) => user.status === "Verified").length;
  const pending = users.filter((user) => user.status === "Pending verification").length;
  const suspended = users.filter((user) => user.status === "Suspended").length;
  const totalLessons = users.reduce((sum, user) => sum + user.lessonsCompleted, 0);
  const totalQuizzes = users.reduce((sum, user) => sum + user.quizAttempts, 0);
  const averageScoreRows = users.flatMap((user) => user.averageQuizScore === null ? [] : [user.averageQuizScore]);
  const overallAverage = averageScoreRows.length ? Math.round(averageScoreRows.reduce((sum, score) => sum + score, 0) / averageScoreRows.length) : "";

  function exportUsers() {
    downloadCsv("sarath-iga-users.csv",
      ["User ID", "Name", "Email", "Experience level", "Account status", "Email verified", "Registered at", "Last login", "Last learning activity"],
      users.map((user) => [user.id, user.fullName, user.email, user.experienceLevel, user.status, user.emailConfirmedAt ? "Yes" : "No", dateLabel(user.registeredAt), dateLabel(user.lastLoginAt), dateLabel(user.lastActivityAt)]));
  }
  function exportLearning() {
    downloadCsv("sarath-iga-learning-activity.csv",
      ["User ID", "Name", "Email", "Lessons completed", "Quiz attempts", "Average quiz score (%)", "Mock interviews", "Connectors started", "Last activity"],
      inPeriod.map((user) => [user.id, user.fullName, user.email, user.lessonsCompleted, user.quizAttempts, user.averageQuizScore ?? "", user.interviews, user.connectorsStarted, dateLabel(user.lastActivityAt)]));
  }
  function exportSummary() {
    downloadCsv("sarath-iga-platform-summary.csv", ["Metric", "Value"], [
      ["Generated at", data?.generatedAt ?? new Date().toISOString()],
      ["Registered users", users.length], ["Verified accounts", verified], ["Pending verification", pending],
      ["Suspended accounts", suspended], ["Lessons completed", totalLessons], ["Quiz attempts", totalQuizzes],
      ["Average user quiz score (%)", overallAverage], ["Users with activity in selected period", inPeriod.length],
      ["Selected activity period", period === "all" ? "All time" : `Last ${period} days`],
    ]);
  }

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">Reports & exports</h2><p className="text-sm text-muted-foreground">Download administrator reports as Excel-compatible CSV files.</p></div>
      <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />Refresh data</Button>
    </div>
    {isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Preparing report data…</p> : isError ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{(error as Error)?.message || "Unable to prepare reports."}</div> : <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Registered users", users.length], ["Verified accounts", verified], ["Lessons completed", totalLessons], ["Quiz attempts", totalQuizzes],
        ].map(([label, value]) => <div key={String(label)} className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
      </div>
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div><h3 className="font-semibold">Learning activity report</h3><p className="text-sm text-muted-foreground">Choose a reporting period for the learning activity export.</p></div>
        <div className="flex flex-wrap items-center gap-3">
          <select className="h-9 rounded-md border bg-card px-3 text-sm" value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option><option value="all">All time</option>
          </select>
          <Badge variant="secondary">{inPeriod.length} users in report</Badge>
          <Button onClick={exportLearning}><Download className="mr-2 h-4 w-4" />Export learning activity</Button>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-5 space-y-3"><FileSpreadsheet className="h-6 w-6 text-muted-foreground" /><h3 className="font-semibold">User directory</h3><p className="text-sm text-muted-foreground">Account status, experience level, verification and login dates for all registered users.</p><Button variant="outline" className="w-full" onClick={exportUsers}><Download className="mr-2 h-4 w-4" />Export users CSV</Button></div>
        <div className="rounded-xl border bg-card p-5 space-y-3"><FileSpreadsheet className="h-6 w-6 text-muted-foreground" /><h3 className="font-semibold">Platform summary</h3><p className="text-sm text-muted-foreground">High-level user, learning and quiz metrics with the report generation timestamp.</p><Button variant="outline" className="w-full" onClick={exportSummary}><Download className="mr-2 h-4 w-4" />Export summary CSV</Button></div>
        <div className="rounded-xl border bg-card p-5 space-y-3"><FileSpreadsheet className="h-6 w-6 text-muted-foreground" /><h3 className="font-semibold">Learning activity</h3><p className="text-sm text-muted-foreground">Per-user lesson, quiz, interview and connector activity for the selected period.</p><Button variant="outline" className="w-full" onClick={exportLearning}><Download className="mr-2 h-4 w-4" />Export activity CSV</Button></div>
      </div>
      <p className="text-xs text-muted-foreground">Reports use the existing administrator-only user analytics endpoint. CSV files open in Excel and other spreadsheet applications. Quiz average is the average of each user's recorded average score; it is not a weighted platform-wide score.</p>
    </>}
  </div>;
}

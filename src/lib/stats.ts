import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ALL_LESSONS, MODULES } from "./content";

export function useActivity() {
  return useQuery({
    queryKey: ["activity"],
    queryFn: async () => {
      const [p, q, i] = await Promise.all([
        supabase.from("lesson_progress").select("lesson_id,module_id,completed_at"),
        supabase.from("quiz_attempts").select("module_id,score,total,is_certification,created_at").order("created_at"),
        supabase.from("interviews").select("id,topic,level,score,created_at").order("created_at"),
      ]);
      return { progress: p.data ?? [], attempts: q.data ?? [], interviews: i.data ?? [] };
    },
  });
}

export type Activity = NonNullable<ReturnType<typeof useActivity>["data"]>;

const day = (d: string | Date) => new Date(d).toISOString().slice(0, 10);

export function computeStats(a: Activity) {
  const done = new Set(a.progress.map((p) => p.lesson_id));
  const modulesDone = MODULES.filter((m) => m.lessons.every((l) => done.has(l.id))).length;
  const modulesStarted = MODULES.filter((m) => m.lessons.some((l) => done.has(l.id))).length;
  const pct = Math.round((done.size / ALL_LESSONS.length) * 100);
  const avg = a.attempts.length
    ? Math.round(a.attempts.reduce((s, x) => s + (x.score / x.total) * 100, 0) / a.attempts.length)
    : 0;
  const cert = a.attempts.filter((x) => x.is_certification);
  const bestCert = cert.length ? Math.max(...cert.map((x) => Math.round((x.score / x.total) * 100))) : 0;
  const completedInterviews = a.interviews.filter((x) => x.score != null);

  const days = new Set([
    ...a.progress.map((x) => day(x.completed_at)),
    ...a.attempts.map((x) => day(x.created_at)),
    ...a.interviews.map((x) => day(x.created_at)),
  ]);
  let streak = 0;
  const cur = new Date();
  if (!days.has(day(cur))) cur.setDate(cur.getDate() - 1);
  while (days.has(day(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  const weekly = Array.from({ length: 7 }, (_, k) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - k));
    const key = day(d);
    return {
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      lessons: a.progress.filter((x) => day(x.completed_at) === key).length,
      quizzes: a.attempts.filter((x) => day(x.created_at) === key).length,
    };
  });

  const topic = MODULES.map((m) => {
    const at = a.attempts.filter((x) => x.module_id === m.id);
    return {
      module: `M${m.num}`,
      title: m.title,
      score: at.length ? Math.round(at.reduce((s, x) => s + (x.score / x.total) * 100, 0) / at.length) : null,
    };
  });

  const completion = MODULES.map((m) => ({
    module: `M${m.num}`,
    pct: Math.round((m.lessons.filter((l) => done.has(l.id)).length / m.lessons.length) * 100),
  }));

  const interviewTrend = completedInterviews.map((x, k) => ({ n: `#${k + 1}`, score: x.score }));
  const next = ALL_LESSONS.filter((l) => !done.has(l.id)).slice(0, 4);

  return { done, modulesDone, modulesStarted, pct, avg, bestCert, completedInterviews, streak, weekly, topic, completion, interviewTrend, next };
}

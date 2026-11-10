import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Rows<T> = { data: T[] | null; error: { message: string } | null };
async function readAll<T>(fetchPage: (from: number, to: number) => PromiseLike<Rows<T>>): Promise<T[]> {
  const result: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw new Error(error.message);
    result.push(...(data ?? []));
    if (!data || data.length < 1000) return result;
  }
}

type DatedUser = { user_id: string; created_at: string };
type LessonRow = { user_id: string; completed_at: string };
type QuizRow = { user_id: string; score: number; total: number; created_at: string };
type ConnectorRow = { user_id: string; updated_at: string };
type ModuleViewRow = { id: string; user_id: string; module_id: string; module_title: string; opened_at: string };
type ProfileNameRow = { id: string; full_name: string | null };

export const getAdminPlatformAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Forbidden: administrator access required");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [profiles, lessons, quizzes, interviews, connectors, moduleViews, userProfiles, modulesCount, lessonCount, labsCount, connectorCount] =
      await Promise.all([
        readAll<{ id: string; created_at: string }>((from, to) =>
          supabaseAdmin.from("profiles").select("id,created_at").range(from, to)),
        readAll<LessonRow>((from, to) =>
          supabaseAdmin.from("lesson_progress").select("user_id,completed_at").range(from, to)),
        readAll<QuizRow>((from, to) =>
          supabaseAdmin.from("quiz_attempts").select("user_id,score,total,created_at").range(from, to)),
        readAll<DatedUser>((from, to) =>
          supabaseAdmin.from("interviews").select("user_id,created_at").range(from, to)),
        readAll<ConnectorRow>((from, to) =>
          supabaseAdmin.from("connector_progress").select("user_id,updated_at").range(from, to)),
        readAll<ModuleViewRow>((from, to) =>
          supabaseAdmin.from("module_views").select("id,user_id,module_id,module_title,opened_at").order("opened_at", { ascending: false }).range(from, to)),
        readAll<ProfileNameRow>((from, to) =>
          supabaseAdmin.from("profiles").select("id,full_name").range(from, to)),
        supabaseAdmin.from("modules").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("lessons").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("labs").select("*", { count: "exact", head: true }),
        supabaseAdmin.from("connectors").select("*", { count: "exact", head: true }),
      ]);

    const now = new Date();
    const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
      return { key: monthKey(date), month: date.toLocaleDateString("en", { month: "short", year: "2-digit" }), registrations: 0, lessonCompletions: 0, quizAttempts: 0 };
    });
    const byMonth = new Map(months.map((month) => [month.key, month]));
    const addMonth = (timestamp: string, key: "registrations" | "lessonCompletions" | "quizAttempts") => {
      const date = new Date(timestamp);
      const item = byMonth.get(monthKey(date));
      if (item) item[key] += 1;
    };
    profiles.forEach((row) => addMonth(row.created_at, "registrations"));
    lessons.forEach((row) => addMonth(row.completed_at, "lessonCompletions"));
    quizzes.forEach((row) => addMonth(row.created_at, "quizAttempts"));

    const activeSince = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = new Set<string>();
    lessons.forEach((row) => { if (new Date(row.completed_at) >= activeSince) activeUsers.add(row.user_id); });
    quizzes.forEach((row) => { if (new Date(row.created_at) >= activeSince) activeUsers.add(row.user_id); });
    interviews.forEach((row) => { if (new Date(row.created_at) >= activeSince) activeUsers.add(row.user_id); });
    connectors.forEach((row) => { if (new Date(row.updated_at) >= activeSince) activeUsers.add(row.user_id); });

    const validQuizzes = quizzes.filter((row) => row.total > 0);
    const averageScore = validQuizzes.length
      ? Math.round(validQuizzes.reduce((sum, row) => sum + (row.score / row.total) * 100, 0) / validQuizzes.length)
      : 0;
    const passed = validQuizzes.filter((row) => row.score / row.total >= 0.7).length;

    for (const result of [modulesCount, lessonCount, labsCount, connectorCount]) {
      if (result.error) throw new Error(result.error.message);
    }

    const authUsers: { id: string; email?: string }[] = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw new Error(`Unable to load learner email addresses: ${error.message}`);
      authUsers.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const profileById = new Map(userProfiles.map((profile) => [profile.id, profile]));
    const authById = new Map(authUsers.map((authUser) => [authUser.id, authUser]));

    return {
      generatedAt: now.toISOString(),
      recentModuleViews: moduleViews.slice(0, 250).map((view) => ({
        id: view.id,
        userId: view.user_id,
        learnerName: profileById.get(view.user_id)?.full_name || authById.get(view.user_id)?.email || "Learner",
        email: authById.get(view.user_id)?.email ?? "—",
        moduleId: view.module_id,
        moduleTitle: view.module_title,
        openedAt: view.opened_at,
      })),
      totals: {
        registeredUsers: profiles.length,
        activeLearners30d: activeUsers.size,
        lessonsCompleted: lessons.length,
        quizAttempts: quizzes.length,
        averageQuizScore: averageScore,
        quizPassRate: validQuizzes.length ? Math.round((passed / validQuizzes.length) * 100) : 0,
        interviews: interviews.length,
        connectorProgressRecords: connectors.length,
        modules: modulesCount.count ?? 0,
        lessons: lessonCount.count ?? 0,
        labs: labsCount.count ?? 0,
        connectors: connectorCount.count ?? 0,
      },
      monthly: months,
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

async function readAll<T>(
  fetchPage: (from: number, to: number) => Promise<PageResult<T>>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

type ProfileRow = {
  id: string;
  full_name: string | null;
  experience_level: string;
  created_at: string;
};
type ProgressRow = { user_id: string; completed_at: string };
type QuizRow = { user_id: string; score: number; total: number; created_at: string };
type InterviewRow = { user_id: string; created_at: string };
type ConnectorProgressRow = { user_id: string; updated_at: string };

export const getAdminUserAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Verify the caller's role using their authenticated session before using
    // the service-role client. Never trust a role or user ID supplied by the browser.
    const { data: canViewAnalytics, error: permissionError } = await context.supabase.rpc("has_permission", {
      _user_id: context.userId,
      _permission_key: "analytics.view",
    });
    if (permissionError || !canViewAnalytics) {
      throw new Error("Forbidden: analytics.view permission required");
    }

    // This privileged client is imported only inside the server handler.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const authUsers = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (error) throw new Error(`Unable to load registered users: ${error.message}`);
      authUsers.push(...data.users);
      if (data.users.length < 1000) break;
    }

    const [profiles, progress, attempts, interviews, connectorProgress] = await Promise.all([
      readAll<ProfileRow>((from, to) =>
        supabaseAdmin.from("profiles").select("id,full_name,experience_level,created_at").range(from, to),
      ),
      readAll<ProgressRow>((from, to) =>
        supabaseAdmin.from("lesson_progress").select("user_id,completed_at").range(from, to),
      ),
      readAll<QuizRow>((from, to) =>
        supabaseAdmin.from("quiz_attempts").select("user_id,score,total,created_at").range(from, to),
      ),
      readAll<InterviewRow>((from, to) =>
        supabaseAdmin.from("interviews").select("user_id,created_at").range(from, to),
      ),
      readAll<ConnectorProgressRow>((from, to) =>
        supabaseAdmin.from("connector_progress").select("user_id,updated_at").range(from, to),
      ),
    ]);

    const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
    const activityByUser = new Map<
      string,
      {
        lessonsCompleted: number;
        quizScores: number[];
        interviews: number;
        connectorsStarted: number;
        lastActivityAt: string | null;
      }
    >();

    const activity = (userId: string) => {
      let current = activityByUser.get(userId);
      if (!current) {
        current = {
          lessonsCompleted: 0,
          quizScores: [],
          interviews: 0,
          connectorsStarted: 0,
          lastActivityAt: null,
        };
        activityByUser.set(userId, current);
      }
      return current;
    };

    const markActivity = (userId: string, timestamp: string) => {
      const current = activity(userId);
      if (
        timestamp &&
        (!current.lastActivityAt || Date.parse(timestamp) > Date.parse(current.lastActivityAt))
      ) {
        current.lastActivityAt = timestamp;
      }
    };

    for (const row of progress) {
      activity(row.user_id).lessonsCompleted += 1;
      markActivity(row.user_id, row.completed_at);
    }
    for (const row of attempts) {
      const current = activity(row.user_id);
      if (row.total > 0) current.quizScores.push((row.score / row.total) * 100);
      markActivity(row.user_id, row.created_at);
    }
    for (const row of interviews) {
      activity(row.user_id).interviews += 1;
      markActivity(row.user_id, row.created_at);
    }
    for (const row of connectorProgress) {
      activity(row.user_id).connectorsStarted += 1;
      markActivity(row.user_id, row.updated_at);
    }

    return {
      generatedAt: new Date().toISOString(),
      users: authUsers.map((authUser) => {
        const profile = profileById.get(authUser.id);
        const stats = activityByUser.get(authUser.id);
        const bannedUntil = authUser.banned_until ?? null;
        const isSuspended = Boolean(bannedUntil && Date.parse(bannedUntil) > Date.now());
        const emailConfirmedAt = authUser.email_confirmed_at ?? null;
        const quizScores = stats?.quizScores ?? [];
        const averageQuizScore = quizScores.length
          ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length)
          : null;

        return {
          id: authUser.id,
          email: authUser.email ?? "",
          fullName:
            profile?.full_name ||
            String(authUser.user_metadata?.full_name ?? "") ||
            authUser.email ||
            "Unnamed user",
          experienceLevel: profile?.experience_level ?? "Not specified",
          registeredAt: authUser.created_at,
          lastLoginAt: authUser.last_sign_in_at ?? null,
          emailConfirmedAt,
          status: isSuspended ? "Suspended" : emailConfirmedAt ? "Verified" : "Pending verification",
          lessonsCompleted: stats?.lessonsCompleted ?? 0,
          quizAttempts: quizScores.length,
          averageQuizScore,
          interviews: stats?.interviews ?? 0,
          connectorsStarted: stats?.connectorsStarted ?? 0,
          lastActivityAt: stats?.lastActivityAt ?? null,
        };
      }).sort((a, b) => Date.parse(b.registeredAt) - Date.parse(a.registeredAt)),
    };
  });

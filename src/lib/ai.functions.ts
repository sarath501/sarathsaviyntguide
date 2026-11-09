import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAI } from "./ai.server";

type Msg = { role: "user" | "assistant"; content: string };

const clean = (m: Msg[]) =>
  m.slice(-30).map((x) => ({ role: x.role, content: String(x.content).slice(0, 8000) }));

const TUTOR = `You are the Sarath IGA Learning Portal tutor, an expert in Identity Governance and Administration, IAM and Saviynt Enterprise Identity Cloud (EIC).
Explain clearly with practical, real-world implementation examples. Use markdown headings, bullet lists and code blocks (SQL, JSON connector configs) where helpful.
Stay accurate: if you are unsure about a specific Saviynt product detail, say so instead of inventing it. Keep answers focused.`;

export const tutorChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { messages: Msg[]; mode?: string | undefined }) => d)
  .handler(async ({ data }) => {
    const extra = data.mode ? `\nAnswer style requested: ${data.mode}.` : "";
    const text = await runAI(TUTOR + extra, clean(data.messages));
    return { text };
  });

export const interviewTurn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { topic: string; level: string; messages: Msg[] }) => d)
  .handler(async ({ data }) => {
    const sys = `You are a senior technical interviewer running a mock interview for a ${data.level} role focused on "${data.topic}" (Saviynt / IGA / IAM).
Ask ONE question at a time. After each candidate answer, give 1-2 sentences of brief feedback, then ask the next question — increasing depth and mixing conceptual, scenario-based and troubleshooting questions.
Do not answer for the candidate. Keep each turn under 120 words. If there is no prior message, greet briefly and ask the first question.`;
    const msgs = data.messages.length ? clean(data.messages) : [{ role: "user" as const, content: "Start the interview." }];
    const text = await runAI(sys, msgs);
    return { text };
  });

export const interviewEvaluate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { interviewId: string; topic: string; level: string; messages: Msg[] }) => d)
  .handler(async ({ data, context }) => {
    const sys = `You evaluate mock interview transcripts for ${data.level} ${data.topic} roles.
Return the first line exactly as "SCORE: <0-100>". Then markdown sections: **Strengths**, **Gaps**, **Model answers for weak questions**, **What to study next**. Be specific and honest.`;
    const transcript = data.messages.map((m) => `${m.role === "assistant" ? "Interviewer" : "Candidate"}: ${m.content}`).join("\n\n");
    const text = await runAI(sys, [{ role: "user", content: transcript.slice(0, 30000) }]);
    const match = text.match(/SCORE:\s*(\d{1,3})/i);
    const score = match?.[1] ? Math.min(100, parseInt(match[1], 10)) : null;
    const feedback = text.replace(/^.*SCORE:.*\n?/i, "").trim();
    const { error } = await context.supabase
      .from("interviews")
      .update({ score, feedback, transcript: data.messages })
      .eq("id", data.interviewId)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { score, feedback };
  });

export const generatePlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { level: string; goal: string; hours: number; weeks: number; weak: string; strengths: string }) => d)
  .handler(async ({ data }) => {
    const sys = `You design personalized Saviynt IGA study plans. Output markdown with a week-by-week plan (headings per week), daily focus items, hands-on practice, and checkpoints. Reference these platform modules by name where relevant: IAM & IGA Fundamentals, Saviynt EIC Fundamentals, Saviynt Implementation, Application Connectors, Access Request Management, Access Certification, RBAC & Role Management, Segregation of Duties, Analytics & SQL, Workflows & Automation, Advanced IGA Topics, Troubleshooting Lab, Mock Interviews.`;
    const prompt = `Experience: ${data.level}\nGoal: ${data.goal}\nHours per week: ${data.hours}\nWeeks available: ${data.weeks}\nWeak areas (from quiz data): ${data.weak || "none yet"}\nStrong areas: ${data.strengths || "none yet"}`;
    const text = await runAI(sys, [{ role: "user", content: prompt }]);
    return { text };
  });

export const generateLessonContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lessonId: string; guidance?: string | undefined }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { LESSON_SYSTEM } = await import("./lesson-prompt");
    const { data: lesson, error } = await context.supabase.from("lessons").select("id,title,summary,module_id").eq("id", data.lessonId).single();
    if (error || !lesson) throw new Error("Lesson not found");
    const { data: mod } = await context.supabase.from("modules").select("num,title").eq("id", lesson.module_id).single();
    const prompt = `Module ${mod?.num}: ${mod?.title}\nLesson: ${lesson.title}\nLesson summary: ${lesson.summary}\n${data.guidance ? `Extra guidance from the instructor: ${data.guidance}\n` : ""}Write the full lesson JSON.`;
    const text = (await runAI(LESSON_SYSTEM, [{ role: "user", content: prompt }])).trim();
    let content: unknown;
    try {
      content = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    } catch {
      throw new Error("The AI returned content in an unexpected format — please try again.");
    }
    const { error: upErr } = await context.supabase.from("lessons").update({ content: content as never, updated_at: new Date().toISOString() }).eq("id", lesson.id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

export const generateConnectorContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { connectorId: string; guidance?: string | undefined }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { CONNECTOR_SYSTEM_A, CONNECTOR_SYSTEM_B, connectorPrompt, parseJson } = await import("./connector-prompt");
    const { data: c, error } = await context.supabase.from("connectors").select("name,category,support_type,summary").eq("id", data.connectorId).single();
    if (error || !c) throw new Error("Connector not found");
    const prompt = connectorPrompt(c, data.guidance);
    const [a, b] = await Promise.all([
      runAI(CONNECTOR_SYSTEM_A, [{ role: "user", content: prompt }]),
      runAI(CONNECTOR_SYSTEM_B, [{ role: "user", content: prompt }]),
    ]);
    let content: Record<string, unknown>;
    try {
      content = { ...parseJson(a), ...parseJson(b) };
    } catch {
      throw new Error("The AI returned content in an unexpected format — please try again.");
    }
    const { error: upErr } = await context.supabase.from("connectors").update({ content: content as never, updated_at: new Date().toISOString() }).eq("id", data.connectorId);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });

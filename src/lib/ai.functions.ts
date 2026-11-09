import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAI } from "./ai.server";

type Msg = { role: "user" | "assistant"; content: string };

const clean = (m: Msg[]) =>
  m.slice(-30).map((x) => ({ role: x.role, content: String(x.content).slice(0, 8000) }));

const TUTOR = `You are the IGA Academy AI tutor, an expert in Identity Governance and Administration, IAM and Saviynt Enterprise Identity Cloud (EIC).
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

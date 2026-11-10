import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type SignupWebhook = {
  type?: string;
  table?: string;
  schema?: string;
  record?: {
    id?: string;
    email?: string | null;
    created_at?: string;
    email_confirmed_at?: string | null;
    raw_user_meta_data?: Record<string, unknown> | null;
  };
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char] ?? char);
}

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const expectedSecret = Deno.env.get("SIGNUP_WEBHOOK_SECRET");
  const suppliedSecret = request.headers.get("x-signup-webhook-secret");
  if (!expectedSecret || !suppliedSecret || suppliedSecret !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: SignupWebhook;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (
    payload.type !== "INSERT" ||
    payload.schema !== "auth" ||
    payload.table !== "users" ||
    !payload.record?.id ||
    !payload.record.email
  ) {
    return new Response("Unsupported signup event", { status: 400 });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const recipient = Deno.env.get("SIGNUP_NOTIFICATION_EMAIL") ?? "avalasarath01@gmail.com";
  const from = Deno.env.get("SIGNUP_NOTIFICATION_FROM") ?? "Sarath IGA Portal <onboarding@resend.dev>";
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return new Response("Email provider is not configured", { status: 500 });
  }

  const email = payload.record.email;
  const metadata = payload.record.raw_user_meta_data ?? {};
  const fullName = typeof metadata.full_name === "string"
    ? metadata.full_name
    : typeof metadata.name === "string"
    ? metadata.name
    : "Not provided";
  const signupDate = payload.record.created_at
    ? new Date(payload.record.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : "Not available";
  const verificationStatus = payload.record.email_confirmed_at ? "Verified" : "Pending email verification";

  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safeDate = escapeHtml(signupDate);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: "New learner registered – Sarath IGA Learning Portal",
      text: [
        "A new learner has registered on your portal.",
        "",
        `Name: ${fullName}`,
        `Email: ${email}`,
        `Registered: ${signupDate} (IST)`,
        `Email status: ${verificationStatus}`,
        `User ID: ${payload.record.id}`,
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#172033;line-height:1.6">
          <h2 style="margin-bottom:8px">New learner registration</h2>
          <p>A new learner has created an account on Sarath IGA Learning Portal.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Name</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${safeName}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Email</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${safeEmail}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Registered (IST)</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${safeDate}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb;color:#64748b">Email status</td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${verificationStatus}</td></tr>
          </table>
          <p style="margin-top:20px;font-size:12px;color:#64748b">Automated notification from Sarath IGA Learning Portal.</p>
        </div>`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Resend delivery failed", response.status, details.slice(0, 500));
    return new Response("Notification delivery failed", { status: 502 });
  }

  return new Response("Notification sent", { status: 200 });
});

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { LEVELS } from "@/lib/content";



export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ mode: (s.mode as string | undefined) ?? undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — IGA Academy AI" },
      { name: "description", content: "Sign in or create your IGA Academy AI account." },
      { property: "og:title", content: "Sign in — IGA Academy AI" },
      { property: "og:description", content: "Sign in or create your IGA Academy AI account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initial === "signup" ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name, experience_level: level } },
        });
        if (error) throw error;
        setSent("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setSent("If an account exists, a reset link is on its way.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden flex-col justify-between bg-hero p-10 text-navy-foreground md:flex">
        <Link to="/"><Logo light /></Link>
        <div>
          <h2 className="text-3xl font-semibold">Master Identity Governance.</h2>
          <p className="mt-2 text-navy-muted">Build real-world IAM expertise with structured lessons and AI coaching.</p>
        </div>
        <p className="text-xs text-navy-muted">Saviynt EIC · RBAC · SoD · Certifications · Connectors</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div className="md:hidden"><Logo /></div>
          <h1 className="text-2xl font-semibold">
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
          </h1>
          {sent ? (
            <p className="rounded-md bg-accent p-4 text-sm text-accent-foreground">{sent}</p>
          ) : (
            <>
              {mode === "signup" && (
                <>
                  <div className="space-y-1.5"><Label htmlFor="name">Full name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
                  <div className="space-y-1.5">
                    <Label htmlFor="level">Experience level</Label>
                    <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} className="h-9 w-full rounded-md border bg-card px-3 text-sm">
                      {LEVELS.map((l) => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              {mode !== "forgot" && (
                <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
              </Button>
            </>
          )}
          <div className="flex justify-between text-sm">
            {mode !== "signin" ? (
              <button type="button" className="text-primary" onClick={() => { setMode("signin"); setSent(null); }}>Back to sign in</button>
            ) : (
              <>
                <button type="button" className="text-primary" onClick={() => setMode("signup")}>Create account</button>
                <button type="button" className="text-muted-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

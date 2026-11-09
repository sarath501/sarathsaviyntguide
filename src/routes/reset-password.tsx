import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — IGA Academy AI" },
      { name: "description", content: "Choose a new password for your IGA Academy AI account." },
      { property: "og:title", content: "Set a new password — IGA Academy AI" },
      { property: "og:description", content: "Choose a new password for your IGA Academy AI account." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <Logo />
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <Input type="password" minLength={8} required placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Button className="w-full" type="submit">Update password</Button>
      </form>
    </div>
  );
}

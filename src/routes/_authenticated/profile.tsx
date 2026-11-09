import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, useUser } from "@/hooks/use-auth";
import { LEVELS } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Sarath IGA Learning Portal" }] }),
  component: Profile,
});

function Profile() {
  const { user } = useUser();
  const { data: profile } = useProfile();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<string>(LEVELS[0]!);
  const [bio, setBio] = useState("");
  const [cur, setCur] = useState("");
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setLevel(profile.experience_level);
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("profiles").update({ full_name: name, experience_level: level, bio }).eq("id", user!.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile saved");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: cur } as { password: string });
    if (error) { toast.error(error.message); return; }
    toast.success("Password changed");
    setPw("");
    setCur("");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Profile & settings" subtitle={user?.email ?? ""} />
      <form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Profile</h2>
        <div className="space-y-1.5"><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Experience level</Label>
          <select className="h-9 w-full rounded-md border bg-card px-3 text-sm" value={level} onChange={(e) => setLevel(e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
        </div>
        <div className="space-y-1.5"><Label>About / learning goals</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} /></div>
        <Button type="submit">Save</Button>
      </form>
      <form onSubmit={changePw} className="space-y-4 rounded-xl border bg-card p-6 shadow-card">
        <h2 className="font-semibold">Change password</h2>
        <Input type="password" placeholder="Current password" value={cur} onChange={(e) => setCur(e.target.value)} required />
        <Input type="password" placeholder="New password (min 8 chars)" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required />
        <Button type="submit" variant="outline">Update password</Button>
      </form>
    </div>
  );
}

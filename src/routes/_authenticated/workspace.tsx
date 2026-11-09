import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-auth";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/workspace")({ component: Workspace });
type Note = { id: string; title: string; body: string; updated_at: string };
function Workspace() {
  const { user } = useUser();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["learner-notes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("learner_notes").select("id,title,body,updated_at").eq("user_id", user!.id).order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Note[];
    },
  });
  async function save() {
    if (!user || !title.trim() || !body.trim()) return;
    const payload = { title: title.trim(), body: body.trim(), user_id: user.id, updated_at: new Date().toISOString() };
    const result = editing
      ? await supabase.from("learner_notes").update(payload).eq("id", editing).eq("user_id", user.id)
      : await supabase.from("learner_notes").insert(payload);
    if (result.error) { toast.error(result.error.message); return; }
    setTitle(""); setBody(""); setEditing(null);
    await qc.invalidateQueries({ queryKey: ["learner-notes", user.id] });
    toast.success("Note saved");
  }
  async function remove(id: string) {
    if (!user) return;
    const { error } = await supabase.from("learner_notes").delete().eq("id", id).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else { await qc.invalidateQueries({ queryKey: ["learner-notes", user.id] }); toast.success("Note deleted"); }
  }
  return <div className="space-y-6"><PageHeader title="My Learning Workspace" subtitle="Keep private study notes, troubleshooting findings and revision points in one place." />
    <section className="space-y-3 rounded-xl border bg-card p-5"><h2 className="font-semibold">{editing ? "Edit note" : "Create a note"}</h2><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Note title" /><Textarea rows={6} value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your notes, SQL snippets, connector observations or interview revision points..." /><div className="flex gap-2"><Button onClick={save} disabled={!title.trim() || !body.trim()}>{editing ? "Update note" : "Save note"}</Button>{editing && <Button variant="outline" onClick={()=>{setEditing(null);setTitle("");setBody("");}}>Cancel</Button>}</div></section>
    <section className="space-y-3"><h2 className="font-semibold">Saved notes ({notes.length})</h2>{isLoading ? <p className="text-sm text-muted-foreground">Loading notes…</p> : notes.length ? notes.map(n=><article key={n.id} className="rounded-xl border bg-card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h3 className="font-medium">{n.title}</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p><p className="mt-2 text-xs text-muted-foreground">Updated {new Date(n.updated_at).toLocaleString()}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={()=>{setEditing(n.id);setTitle(n.title);setBody(n.body);}}>Edit</Button><Button size="sm" variant="ghost" onClick={()=>void remove(n.id)}>Delete</Button></div></div></article>) : <p className="rounded-xl border p-5 text-sm text-muted-foreground">Your workspace is empty. Create your first study note above.</p>}</section>
  </div>;
}
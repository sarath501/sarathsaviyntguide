import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsAdmin } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, Plus, Trash2, RefreshCw } from "lucide-react";

type NotificationRow = {
  id: string; user_id: string | null; title: string; message: string;
  category: "announcement" | "learning" | "system"; created_at: string;
  expires_at: string | null;
};

const card = "rounded-xl border bg-card p-5";
const field = "h-9 w-full rounded-md border bg-card px-3 text-sm";

export function AdminNotifications() {
  const qc = useQueryClient();
  const { data: isAdmin } = useIsAdmin();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<NotificationRow["category"]>("announcement");
  const [audience, setAudience] = useState("all");
  const [expiresIn, setExpiresIn] = useState("never");
  const [busy, setBusy] = useState(false);
  const query = useQuery({
    queryKey: ["admin-notifications"],
    enabled: Boolean(isAdmin),
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("notifications")
        .select("id,user_id,title,message,category,created_at,expires_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });
  async function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setBusy(true);
    const expiresAt = expiresIn === "never" ? null : new Date(Date.now() + Number(expiresIn) * 86400000).toISOString();
    const { error } = await (supabase as any).from("notifications").insert({
      title: title.trim(), message: message.trim(), category,
      user_id: audience === "all" ? null : audience,
      created_by: (await supabase.auth.getUser()).data.user?.id,
      expires_at: expiresAt,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Notification published");
    setTitle(""); setMessage(""); setAudience("all"); setCategory("announcement"); setExpiresIn("never");
    await qc.invalidateQueries({ queryKey: ["admin-notifications"] });
  }
  async function remove(id: string) {
    if (!confirm("Delete this notification?")) return;
    const { error } = await (supabase as any).from("notifications").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Notification deleted"); qc.invalidateQueries({ queryKey: ["admin-notifications"] }); }
  }
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">Notification center</h2><p className="text-sm text-muted-foreground">Publish in-app announcements and targeted messages.</p></div>
      <Button variant="outline" size="sm" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
    </div>
    <form onSubmit={publish} className={`${card} space-y-3`}>
      <div className="flex items-center gap-2"><Bell className="h-5 w-5 text-muted-foreground" /><h3 className="font-semibold">Create notification</h3></div>
      <Input required maxLength={160} placeholder="Notification title (max 160 characters)" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea required maxLength={4000} rows={4} placeholder="Write your announcement or message (max 4,000 characters)" value={message} onChange={(e) => setMessage(e.target.value)} />
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs text-muted-foreground">Category<select className={field} value={category} onChange={(e) => setCategory(e.target.value as NotificationRow["category"])}><option value="announcement">Announcement</option><option value="learning">Learning update</option><option value="system">System notice</option></select></label>
        <label className="space-y-1 text-xs text-muted-foreground">Audience<select className={field} value={audience} onChange={(e) => setAudience(e.target.value)}><option value="all">All users (broadcast)</option></select></label>
        <label className="space-y-1 text-xs text-muted-foreground">Expiry<select className={field} value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)}><option value="never">No expiry</option><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option></select></label>
      </div>
      <p className="text-xs text-muted-foreground">Broadcast messages are visible to signed-in users. Targeted delivery to individual users will be enabled in a later iteration once user selection is added.</p>
      <Button type="submit" disabled={busy || !title.trim() || !message.trim()}><Plus className="mr-2 h-4 w-4" />{busy ? "Publishing…" : "Publish notification"}</Button>
    </form>
    <div className={card}>
      <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Published notifications</h3><Badge variant="secondary">{query.data?.length ?? 0}</Badge></div>
      {query.isLoading ? <p className="py-6 text-sm text-muted-foreground">Loading notifications…</p> : query.isError ? <p className="py-6 text-sm text-destructive">{(query.error as Error).message}</p> : !query.data?.length ? <p className="py-6 text-sm text-muted-foreground">No notifications published yet.</p> : <ul className="divide-y">{query.data.map((item) => <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{item.title}</p><Badge variant="secondary">{item.category}</Badge><Badge variant="outline">{item.user_id ? "Targeted" : "Broadcast"}</Badge></div><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p><p className="mt-2 text-xs text-muted-foreground">Published {new Date(item.created_at).toLocaleString()}{item.expires_at ? ` · Expires ${new Date(item.expires_at).toLocaleDateString()}` : ""}</p></div>
        <Button size="icon" variant="ghost" onClick={() => remove(item.id)} aria-label="Delete notification"><Trash2 className="h-4 w-4" /></Button>
      </li>)}</ul>}
    </div>
  </div>;
}

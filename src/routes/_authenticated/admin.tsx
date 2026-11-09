import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2, Plus, Sparkles as Wand, Upload, Eye, EyeOff, Search, RefreshCw, Users, Mail, CalendarDays, Clock, BookOpen, ClipboardCheck, MessageSquare, Plug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useIsAdmin } from "@/hooks/use-auth";
import { useCurriculum, type LessonContent } from "@/lib/curriculum";
import { DIAGRAMS } from "@/lib/diagrams";
import { generateConnectorContent, generateLessonContent } from "@/lib/ai.functions";
import { CONNECTOR_CATEGORIES, useConnectors, type Connector } from "@/lib/connectors";
import { getAdminUserAnalytics } from "@/lib/admin.functions";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { AdminReports } from "@/components/AdminReports";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Sarath IGA Learning Portal" }] }),
  component: Admin,
});

const sel = "h-9 w-full rounded-md border bg-card px-3 text-sm";
const card = "rounded-xl border bg-card p-6 shadow-card";
const err = (e: { message: string } | null) => { if (e) { toast.error(e.message); return true; } return false; };

function Admin() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  if (isLoading) return <p>Loading…</p>;
  if (!isAdmin) return <p className="text-muted-foreground">You don't have access to this page.</p>;
  return (
    <div>
      <PageHeader title="Administrator dashboard" subtitle="Platform usage and learning content management." />
      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="labs">Labs</TabsTrigger>
          <TabsTrigger value="connectors">Connectors</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><Overview /></TabsContent>
        <TabsContent value="users"><UsersAdmin /></TabsContent>
        <TabsContent value="reports"><AdminReports /></TabsContent>
        <TabsContent value="modules"><Modules /></TabsContent>
        <TabsContent value="lessons"><Lessons /></TabsContent>
        <TabsContent value="questions"><Questions /></TabsContent>
        <TabsContent value="labs"><Labs /></TabsContent>
        <TabsContent value="connectors"><ConnectorsAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function Overview() { return <AdminAnalytics />; }

function UsersAdmin() {
  const loadUsers = useServerFn(getAdminUserAnalytics);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-user-analytics"],
    queryFn: () => loadUsers(),
    staleTime: 30_000,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [experience, setExperience] = useState("all");
  const [activity, setActivity] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const users = data?.users ?? [];
  const filtered = users.filter((user) => {
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.id.toLowerCase().includes(term);
    const matchesStatus = status === "all" || user.status === status;
    const matchesExperience = experience === "all" || user.experienceLevel === experience;
    const lastActivity = user.lastActivityAt ? Date.parse(user.lastActivityAt) : 0;
    const activeRecently = lastActivity >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    const matchesActivity = activity === "all" || (activity === "active" ? activeRecently : !activeRecently);
    return matchesSearch && matchesStatus && matchesExperience && matchesActivity;
  }).sort((a, b) => {
    if (sort === "oldest") return Date.parse(a.registeredAt) - Date.parse(b.registeredAt);
    if (sort === "name") return a.fullName.localeCompare(b.fullName);
    if (sort === "last-login") return Date.parse(b.lastLoginAt ?? "") - Date.parse(a.lastLoginAt ?? "");
    if (sort === "most-lessons") return b.lessonsCompleted - a.lessonsCompleted;
    return Date.parse(b.registeredAt) - Date.parse(a.registeredAt);
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const experienceOptions = [...new Set(users.map((user) => user.experienceLevel).filter(Boolean))].sort();
  const selected = users.find((user) => user.id === selectedId);
  const activeCount = users.filter((user) => user.status === "Verified").length;
  const pendingCount = users.filter((user) => user.status === "Pending verification").length;
  const suspendedCount = users.filter((user) => user.status === "Suspended").length;
  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleString() : "Never";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          { label: "Registered users", value: users.length, icon: Users },
          { label: "Verified accounts", value: activeCount, icon: BookOpen },
          { label: "Pending verification", value: pendingCount, icon: Mail },
          { label: "Suspended accounts", value: suspendedCount, icon: Clock },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-2 font-display text-2xl font-semibold">{isLoading ? "…" : item.value}</p>
          </div>
        ))}
      </div>

      <div className={card}>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold">Registered users</h2>
            <p className="text-xs text-muted-foreground">
              Individual registration, sign-in and learning activity statistics.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <div className="relative sm:col-span-2 xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search by name, email or user ID" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} />
          </div>
          <select className={sel} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All account statuses</option><option value="Verified">Verified</option><option value="Pending verification">Pending verification</option><option value="Suspended">Suspended</option>
          </select>
          <select className={sel} value={experience} onChange={(event) => { setExperience(event.target.value); setPage(1); }}>
            <option value="all">All experience levels</option>{experienceOptions.map((level) => <option key={level} value={level}>{level}</option>)}
          </select>
          <select className={sel} value={activity} onChange={(event) => { setActivity(event.target.value); setPage(1); }}>
            <option value="all">All activity</option><option value="active">Active in last 30 days</option><option value="inactive">No activity in 30 days</option>
          </select>
          <select className={sel} value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
            <option value="newest">Newest registrations</option><option value="oldest">Oldest registrations</option><option value="name">Name A–Z</option><option value="last-login">Recently signed in</option><option value="most-lessons">Most lessons completed</option>
          </select>
        </div>

        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading registered users…</p>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {(error as Error)?.message || "Unable to load user analytics."}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No users match your search.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="px-3 py-3 font-medium">User</th>
                  <th className="px-3 py-3 font-medium">Registered</th>
                  <th className="px-3 py-3 font-medium">Last login</th>
                  <th className="px-3 py-3 text-center font-medium">Lessons</th>
                  <th className="px-3 py-3 text-center font-medium">Quizzes</th>
                  <th className="px-3 py-3 text-center font-medium">Interviews</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 text-right font-medium">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pageUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/40">
                    <td className="px-3 py-3">
                      <p className="font-medium">{user.fullName || "Unnamed user"}</p>
                      <p className="text-xs text-muted-foreground">{user.email || "No email available"}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                      {new Date(user.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">{user.lessonsCompleted}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{user.quizAttempts}</td>
                    <td className="px-3 py-3 text-center tabular-nums">{user.interviews}</td>
                    <td className="px-3 py-3">
                      <Badge variant={user.status === "Verified" ? "default" : "secondary"}>{user.status}</Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(selectedId === user.id ? null : user.id)}>
                        {selectedId === user.id ? "Close" : "View"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <p className="text-xs text-muted-foreground">Showing {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} matching users ({users.length} total).</p>
          <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Rows per page" className="h-8 rounded-md border bg-card px-2 text-xs" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10 per page</option><option value={25}>25 per page</option><option value={50}>50 per page</option></select>
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
            <span className="text-xs tabular-nums">Page {currentPage} of {totalPages}</span>
            <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next</Button>
          </div>
        </div>
      </div>

      {selected && (
        <div className={card + " space-y-4"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{selected.fullName || "Unnamed user"}</h2>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{selected.id}</p>
            </div>
            <Badge variant={selected.status === "Active" ? "default" : "secondary"}>{selected.status}</Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Experience level", value: selected.experienceLevel },
              { label: "Registered", value: formatDate(selected.registeredAt) },
              { label: "Last login", value: formatDate(selected.lastLoginAt) },
              { label: "Last learning activity", value: formatDate(selected.lastActivityAt) },
              { label: "Email verified", value: selected.emailConfirmedAt ? "Yes" : "No" },
              { label: "Lessons completed", value: selected.lessonsCompleted },
              { label: "Quiz attempts", value: selected.quizAttempts },
              { label: "Average quiz score", value: selected.averageQuizScore === null ? "No attempts" : selected.averageQuizScore + "%" },
              { label: "Mock interviews", value: selected.interviews },
              { label: "Connectors started", value: selected.connectorsStarted },
            ].map((item) => (
              <div key={item.label} className="rounded-lg bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 break-words text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Last activity is calculated from recorded lesson completions, quiz attempts, interviews and connector progress. Page views and a full historical login timeline are not currently recorded.
          </p>
        </div>
      )}
    </div>
  );
}

function Modules() {
  const qc = useQueryClient();
  const { data: cur } = useCurriculum();
  const [f, setF] = useState({ id: "", title: "", level: "Beginner", summary: "" });
  const refresh = () => qc.invalidateQueries({ queryKey: ["curriculum"] });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const num = (cur?.modules.reduce((m, x) => Math.max(m, x.num), 0) ?? 0) + 1;
    if (err((await supabase.from("modules").insert({ ...f, id: f.id || `m${num}`, num })).error)) return;
    setF({ id: "", title: "", level: "Beginner", summary: "" });
    toast.success("Module added");
    refresh();
  }
  async function update(id: string, patch: { title?: string; published?: boolean }) {
    if (!err((await supabase.from("modules").update(patch).eq("id", id)).error)) refresh();
  }
  async function del(id: string) {
    if (!confirm("Delete this module and all its lessons?")) return;
    if (!err((await supabase.from("modules").delete().eq("id", id)).error)) refresh();
  }
  return (
    <div className="space-y-6">
      <form onSubmit={add} className={`${card} grid gap-3 md:grid-cols-2`}>
        <h2 className="font-semibold md:col-span-2">Add module</h2>
        <Input required placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <select className={sel} value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>{["Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}</select>
        <Textarea className="md:col-span-2" placeholder="Summary" value={f.summary} onChange={(e) => setF({ ...f, summary: e.target.value })} />
        <Button type="submit" className="w-fit"><Plus className="mr-1 h-4 w-4" />Add module</Button>
      </form>
      <div className={card}>
        <h2 className="mb-3 font-semibold">Modules</h2>
        <ul className="divide-y">{cur?.modules.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">M{m.num}</span>
            <Input className="h-8 max-w-sm flex-1" defaultValue={m.title} onBlur={(e) => e.target.value !== m.title && update(m.id, { title: e.target.value })} />
            <span className="text-xs text-muted-foreground">{m.lessons.length} lessons</span>
            <Button size="sm" variant="ghost" onClick={() => update(m.id, { published: !m.published })}>{m.published ? <><Eye className="mr-1 h-4 w-4" />Published</> : <><EyeOff className="mr-1 h-4 w-4" />Hidden</>}</Button>
            <Button size="icon" variant="ghost" onClick={() => del(m.id)} aria-label="Delete module"><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}</ul>
      </div>
    </div>
  );
}

function Lessons() {
  const qc = useQueryClient();
  const { data: cur } = useCurriculum();
  const [moduleId, setModuleId] = useState("m1");
  const [editing, setEditing] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const mod = cur?.modules.find((m) => m.id === moduleId);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!mod) return;
    const id = `${mod.id}-l${Date.now().toString(36)}`;
    if (err((await supabase.from("lessons").insert({ id, module_id: mod.id, title: newTitle, position: mod.lessons.length + 1 })).error)) return;
    setNewTitle("");
    qc.invalidateQueries({ queryKey: ["curriculum"] });
    setEditing(id);
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className={`${card} space-y-3`}>
        <select className={sel} value={moduleId} onChange={(e) => { setModuleId(e.target.value); setEditing(null); }}>{cur?.modules.map((m) => <option key={m.id} value={m.id}>M{m.num} · {m.title}</option>)}</select>
        <ul className="space-y-1">{mod?.lessons.map((l) => (
          <li key={l.id}><button onClick={() => setEditing(l.id)} className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${editing === l.id ? "bg-accent" : "hover:bg-muted"}`}><span>{l.title}</span>{!l.published && <Badge variant="outline">Hidden</Badge>}</button></li>
        ))}</ul>
        <form onSubmit={add} className="flex gap-2"><Input required placeholder="New lesson title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /><Button type="submit" size="icon" aria-label="Add lesson"><Plus className="h-4 w-4" /></Button></form>
      </div>
      {editing ? <LessonEditor key={editing} id={editing} onDeleted={() => setEditing(null)} /> : <p className="text-sm text-muted-foreground">Select a lesson to edit.</p>}
    </div>
  );
}

const LIST_FIELDS: [keyof LessonContent, string][] = [["useCases", "Business use cases"], ["troubleshooting", "Troubleshooting methods"], ["bestPractices", "Best practices"], ["exercises", "Practical exercises"], ["takeaways", "Key takeaways"]];

function LessonEditor({ id, onDeleted }: { id: string; onDeleted: () => void }) {
  const qc = useQueryClient();
  const gen = useServerFn(generateLessonContent);
  const { data: lesson, refetch } = useQuery({ queryKey: ["admin-lesson", id], queryFn: async () => (await supabase.from("lessons").select("*").eq("id", id).single()).data });
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [diagram, setDiagram] = useState("");
  const [c, setC] = useState<LessonContent>({});
  const [advanced, setAdvanced] = useState("");
  const [guidance, setGuidance] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!lesson) return;
    setTitle(lesson.title); setSummary(lesson.summary); setDiagram(lesson.diagram_key ?? "");
    setC((lesson.content ?? {}) as LessonContent);
    setAdvanced(JSON.stringify(lesson.content ?? {}, null, 2));
  }, [lesson]);

  if (!lesson) return <p>Loading…</p>;

  const after = () => { qc.invalidateQueries({ queryKey: ["curriculum"] }); qc.invalidateQueries({ queryKey: ["lesson", id] }); refetch(); };

  async function save(content: LessonContent = c) {
    if (err((await supabase.from("lessons").update({ title, summary, diagram_key: diagram || null, content: content as never, updated_at: new Date().toISOString() }).eq("id", id)).error)) return;
    toast.success("Lesson saved");
    after();
  }
  async function saveAdvanced() {
    try { const parsed = JSON.parse(advanced) as LessonContent; setC(parsed); await save(parsed); } catch { toast.error("Invalid JSON"); }
  }
  async function togglePublish() {
    if (!err((await supabase.from("lessons").update({ published: !lesson!.published }).eq("id", id)).error)) after();
  }
  async function del() {
    if (!confirm("Delete this lesson?")) return;
    if (!err((await supabase.from("lessons").delete().eq("id", id)).error)) { qc.invalidateQueries({ queryKey: ["curriculum"] }); onDeleted(); }
  }
  async function aiGenerate() {
    if (c.explanation && !confirm("Replace the existing detailed content with a new AI-written version?")) return;
    setBusy(true);
    try { await gen({ data: { lessonId: id, guidance: guidance || undefined } }); toast.success("Detailed content generated — review before publishing"); after(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }
  async function upload(file: File) {
    const path = `${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    if (err((await supabase.storage.from("diagrams").upload(path, file)).error)) return;
    if (!err((await supabase.from("lessons").update({ diagram_image_url: path }).eq("id", id)).error)) { toast.success("Diagram image uploaded"); after(); }
  }

  const listEdit = (k: keyof LessonContent, label: string) => (
    <label key={k} className="block text-sm">{label} <span className="text-xs text-muted-foreground">(one per line)</span>
      <Textarea rows={3} className="mt-1" value={((c[k] as string[] | undefined) ?? []).join("\n")} onChange={(e) => setC({ ...c, [k]: e.target.value.split("\n").filter((x) => x.trim()) })} />
    </label>
  );

  return (
    <div className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Edit lesson</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={togglePublish}>{lesson.published ? <><EyeOff className="mr-1 h-4 w-4" />Unpublish</> : <><Eye className="mr-1 h-4 w-4" />Publish</>}</Button>
          <Button size="sm" variant="ghost" onClick={del}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Short summary" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">Interactive diagram
          <select className={`${sel} mt-1`} value={diagram} onChange={(e) => setDiagram(e.target.value)}>
            <option value="">None</option>
            {Object.entries(DIAGRAMS).map(([k, d]) => <option key={k} value={k}>{d.title}</option>)}
          </select>
        </label>
        <label className="text-sm">Architecture image {lesson.diagram_image_url && <span className="text-xs text-success">(uploaded)</span>}
          <span className="mt-1 flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-muted-foreground hover:bg-muted"><Upload className="h-4 w-4" />Upload image
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></span>
        </label>
      </div>

      <div className="rounded-lg border border-dashed p-4">
        <p className="text-sm font-medium">Write detailed content with AI</p>
        <p className="text-xs text-muted-foreground">Generates all sections (theory, architecture, steps, code, errors, interview Q&A, exercises, quiz). Review technical details before publishing.</p>
        <div className="mt-2 flex gap-2"><Input placeholder="Optional guidance, e.g. focus on REST pagination" value={guidance} onChange={(e) => setGuidance(e.target.value)} /><Button onClick={aiGenerate} disabled={busy}><Wand className="mr-1 h-4 w-4" />{busy ? "Writing… (up to a minute)" : "Generate"}</Button></div>
      </div>

      <label className="block text-sm">Introduction<Textarea rows={3} className="mt-1" value={c.intro ?? ""} onChange={(e) => setC({ ...c, intro: e.target.value })} /></label>
      <label className="block text-sm">Detailed explanation (markdown)<Textarea rows={6} className="mt-1" value={c.explanation ?? ""} onChange={(e) => setC({ ...c, explanation: e.target.value })} /></label>
      <label className="block text-sm">Architecture & workflow (markdown)<Textarea rows={4} className="mt-1" value={c.architecture ?? ""} onChange={(e) => setC({ ...c, architecture: e.target.value })} /></label>
      <label className="block text-sm">Practical examples (markdown)<Textarea rows={4} className="mt-1" value={c.examples ?? ""} onChange={(e) => setC({ ...c, examples: e.target.value })} /></label>
      {LIST_FIELDS.map(([k, l]) => listEdit(k, l))}

      <div className="space-y-2">
        <p className="text-sm font-medium">SQL / JSON examples</p>
        {(c.code ?? []).map((x, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <div className="flex gap-2">
              <Input value={x.title} placeholder="Title" onChange={(e) => setC({ ...c, code: c.code!.map((y, j) => (j === i ? { ...y, title: e.target.value } : y)) })} />
              <select className="h-9 rounded-md border bg-card px-2 text-sm" value={x.language} onChange={(e) => setC({ ...c, code: c.code!.map((y, j) => (j === i ? { ...y, language: e.target.value } : y)) })}>{["sql", "json", "text", "powershell"].map((l) => <option key={l}>{l}</option>)}</select>
              <Button size="icon" variant="ghost" onClick={() => setC({ ...c, code: c.code!.filter((_, j) => j !== i) })} aria-label="Remove example"><Trash2 className="h-4 w-4" /></Button>
            </div>
            <Textarea rows={5} className="font-mono text-xs" value={x.code} onChange={(e) => setC({ ...c, code: c.code!.map((y, j) => (j === i ? { ...y, code: e.target.value } : y)) })} />
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setC({ ...c, code: [...(c.code ?? []), { language: "sql", title: "", code: "" }] })}><Plus className="mr-1 h-4 w-4" />Add code example</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Interview questions</p>
        {(c.interview ?? []).map((q, i) => (
          <div key={i} className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input value={q.q} placeholder="Question" onChange={(e) => setC({ ...c, interview: c.interview!.map((y, j) => (j === i ? { ...y, q: e.target.value } : y)) })} />
              <Textarea rows={2} value={q.a} placeholder="Answer" onChange={(e) => setC({ ...c, interview: c.interview!.map((y, j) => (j === i ? { ...y, a: e.target.value } : y)) })} />
            </div>
            <Button size="icon" variant="ghost" onClick={() => setC({ ...c, interview: c.interview!.filter((_, j) => j !== i) })} aria-label="Remove question"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setC({ ...c, interview: [...(c.interview ?? []), { q: "", a: "" }] })}><Plus className="mr-1 h-4 w-4" />Add interview question</Button>
      </div>

      <Button onClick={() => save()}>Save lesson</Button>

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">Advanced: edit all content as JSON</summary>
        <Textarea rows={14} className="mt-2 font-mono text-xs" value={advanced} onChange={(e) => setAdvanced(e.target.value)} />
        <Button className="mt-2" size="sm" variant="outline" onClick={saveAdvanced}>Save JSON</Button>
      </details>
    </div>
  );
}

function Questions() {
  const qc = useQueryClient();
  const { data: cur } = useCurriculum();
  const { data: questions } = useQuery({ queryKey: ["admin-questions"], queryFn: async () => (await supabase.from("quiz_questions").select("*").order("created_at", { ascending: false })).data ?? [] });
  const [moduleId, setModuleId] = useState("m1");
  const [question, setQuestion] = useState("");
  const [opts, setOpts] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [expl, setExpl] = useState("");
  const [cert, setCert] = useState(false);
  const [filter, setFilter] = useState("all");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (err((await supabase.from("quiz_questions").insert({ module_id: moduleId, question, options: opts, correct_index: correct, explanation: expl, is_certification: cert })).error)) return;
    toast.success("Question added");
    setQuestion(""); setOpts(["", "", "", ""]); setExpl("");
    qc.invalidateQueries({ queryKey: ["admin-questions"] });
  }
  async function del(id: string) {
    if (!err((await supabase.from("quiz_questions").delete().eq("id", id)).error)) qc.invalidateQueries({ queryKey: ["admin-questions"] });
  }
  const qs = (questions ?? []).filter((q) => filter === "all" || q.module_id === filter);
  return (
    <div className="space-y-6">
      <form onSubmit={add} className={`${card} space-y-3`}>
        <h2 className="font-semibold">Add question</h2>
        <select className={sel} value={moduleId} onChange={(e) => setModuleId(e.target.value)}>{cur?.modules.map((m) => <option key={m.id} value={m.id}>M{m.num} · {m.title}</option>)}</select>
        <Textarea required placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} />
        {opts.map((o, k) => (
          <div key={k} className="flex items-center gap-2">
            <input type="radio" name="correct" checked={correct === k} onChange={() => setCorrect(k)} aria-label={`Option ${k + 1} correct`} />
            <Input required placeholder={`Option ${k + 1}`} value={o} onChange={(e) => setOpts(opts.map((x, j) => (j === k ? e.target.value : x)))} />
          </div>
        ))}
        <Textarea placeholder="Explanation" value={expl} onChange={(e) => setExpl(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cert} onChange={(e) => setCert(e.target.checked)} /> Include in certification practice exams</label>
        <Button type="submit">Add question</Button>
      </form>
      <div className={card}>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Question bank ({qs.length})</h2>
          <select className="h-9 rounded-md border bg-card px-3 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All modules</option>{cur?.modules.map((m) => <option key={m.id} value={m.id}>M{m.num}</option>)}</select>
        </div>
        <ul className="divide-y">{qs.map((q) => (
          <li key={q.id} className="flex items-start justify-between gap-3 py-3 text-sm">
            <span><span className="mr-2 font-mono text-xs text-muted-foreground">{q.module_id.toUpperCase()}</span>{q.question}</span>
            <Button variant="ghost" size="icon" onClick={() => del(q.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
          </li>
        ))}</ul>
      </div>
    </div>
  );
}

function Labs() {
  const qc = useQueryClient();
  const { data: labs } = useQuery({ queryKey: ["labs"], queryFn: async () => (await supabase.from("labs").select("*").order("created_at")).data ?? [] });
  const [f, setF] = useState({ title: "", area: "", difficulty: "Intermediate", symptom: "", steps: "", root_cause: "", fix: "" });
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (err((await supabase.from("labs").insert({ ...f, area: f.area || "General", steps: f.steps.split("\n").filter((x) => x.trim()) })).error)) return;
    toast.success("Scenario added");
    setF({ title: "", area: "", difficulty: "Intermediate", symptom: "", steps: "", root_cause: "", fix: "" });
    qc.invalidateQueries({ queryKey: ["labs"] });
  }
  async function update(id: string, patch: { title?: string; published?: boolean }) {
    if (!err((await supabase.from("labs").update(patch).eq("id", id)).error)) qc.invalidateQueries({ queryKey: ["labs"] });
  }
  async function del(id: string) {
    if (!err((await supabase.from("labs").delete().eq("id", id)).error)) qc.invalidateQueries({ queryKey: ["labs"] });
  }
  return (
    <div className="space-y-6">
      <form onSubmit={add} className={`${card} grid gap-3 md:grid-cols-3`}>
        <h2 className="font-semibold md:col-span-3">Add troubleshooting scenario</h2>
        <Input required placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <Input placeholder="Area (e.g. Connectors)" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} />
        <select className={sel} value={f.difficulty} onChange={(e) => setF({ ...f, difficulty: e.target.value })}>{["Beginner", "Intermediate", "Advanced"].map((l) => <option key={l}>{l}</option>)}</select>
        <Textarea required className="md:col-span-3" placeholder="Symptom" value={f.symptom} onChange={(e) => setF({ ...f, symptom: e.target.value })} />
        <Textarea className="md:col-span-3" placeholder="Investigation steps (one per line)" value={f.steps} onChange={(e) => setF({ ...f, steps: e.target.value })} />
        <Textarea placeholder="Root cause" value={f.root_cause} onChange={(e) => setF({ ...f, root_cause: e.target.value })} />
        <Textarea className="md:col-span-2" placeholder="Fix" value={f.fix} onChange={(e) => setF({ ...f, fix: e.target.value })} />
        <Button type="submit" className="w-fit">Add scenario</Button>
      </form>
      <div className={card}>
        <h2 className="mb-3 font-semibold">Scenarios</h2>
        <ul className="divide-y">{labs?.map((l) => (
          <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span><Badge variant="secondary" className="mr-2">{l.area}</Badge>{l.title}</span>
            <span className="flex">
              <Button size="sm" variant="ghost" onClick={() => update(l.id, { published: !l.published })}>{l.published ? "Published" : "Hidden"}</Button>
              <Button size="icon" variant="ghost" onClick={() => del(l.id)} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
            </span>
          </li>
        ))}</ul>
      </div>
    </div>
  );
}

const CONNECTOR_KEYS = ["overview", "supportNote", "useCases", "architecture", "parameters", "security", "permissions", "endpoint", "imports", "provisioning", "scheduling", "troubleshooting", "scenarios", "lab", "interview", "compare"] as const;

function ConnectorsAdmin() {
  const qc = useQueryClient();
  const { data: list = [] } = useConnectors();
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CONNECTOR_CATEGORIES[0]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return;
    if (err((await supabase.from("connectors").insert({ id: slug, name, category, position: list.length + 1 })).error)) return;
    setName(""); qc.invalidateQueries({ queryKey: ["connectors"] }); setId(slug);
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className={card}>
        <form onSubmit={add} className="mb-4 space-y-2">
          <Input placeholder="New connector name" value={name} onChange={(e) => setName(e.target.value)} />
          <select className={sel} value={category} onChange={(e) => setCategory(e.target.value)}>{CONNECTOR_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <Button type="submit" size="sm" className="w-full"><Plus className="mr-1 h-4 w-4" />Add connector</Button>
        </form>
        <ul className="max-h-[600px] space-y-1 overflow-auto text-sm">
          {list.map((c) => (
            <li key={c.id}><button onClick={() => setId(c.id)} className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left ${id === c.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <span className="truncate">{c.name}</span>{!c.content?.overview ? <span className="text-xs opacity-70">empty</span> : !c.published && <EyeOff className="h-3 w-3" />}
            </button></li>
          ))}
        </ul>
      </div>
      {id ? <ConnectorEditor key={id} c={list.find((x) => x.id === id)} onDeleted={() => setId("")} /> : <p className="text-muted-foreground">Select a connector to edit.</p>}
    </div>
  );
}

function ConnectorEditor({ c, onDeleted }: { c: Connector | undefined; onDeleted: () => void }) {
  const qc = useQueryClient();
  const gen = useServerFn(generateConnectorContent);
  const [meta, setMeta] = useState(() => ({ name: c?.name ?? "", category: c?.category ?? "", support_type: c?.support_type ?? "", difficulty: c?.difficulty ?? "", summary: c?.summary ?? "" }));
  const [section, setSection] = useState<(typeof CONNECTOR_KEYS)[number]>("parameters");
  const [json, setJson] = useState(() => JSON.stringify(c?.content?.[section] ?? null, null, 2));
  const [guidance, setGuidance] = useState("");
  const [busy, setBusy] = useState(false);
  if (!c) return null;
  const refresh = () => qc.invalidateQueries({ queryKey: ["connectors"] });
  function pickSection(s: (typeof CONNECTOR_KEYS)[number]) { setSection(s); setJson(JSON.stringify(c!.content?.[s] ?? null, null, 2)); }
  async function saveMeta() { if (!err((await supabase.from("connectors").update({ ...meta, updated_at: new Date().toISOString() }).eq("id", c!.id)).error)) { toast.success("Saved"); refresh(); } }
  async function saveSection() {
    let parsed: unknown;
    try { parsed = JSON.parse(json); } catch { toast.error("Invalid JSON"); return; }
    const content = { ...c!.content, [section]: parsed };
    if (!err((await supabase.from("connectors").update({ content: content as never, updated_at: new Date().toISOString() }).eq("id", c!.id)).error)) { toast.success("Section saved"); refresh(); }
  }
  async function togglePublish() { if (!err((await supabase.from("connectors").update({ published: !c!.published }).eq("id", c!.id)).error)) refresh(); }
  async function del() { if (confirm("Delete this connector and its learner progress?") && !err((await supabase.from("connectors").delete().eq("id", c!.id)).error)) { refresh(); onDeleted(); } }
  async function aiGenerate() {
    if (c!.content?.overview && !confirm("Replace all content with a new AI-written version?")) return;
    setBusy(true);
    try { await gen({ data: { connectorId: c!.id, guidance: guidance || undefined } }); toast.success("Content generated — review before publishing"); await refresh(); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">{c.name}</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={togglePublish}>{c.published ? <><Eye className="mr-1 h-4 w-4" />Published</> : <><EyeOff className="mr-1 h-4 w-4" />Unpublished</>}</Button>
            <Button size="sm" variant="ghost" onClick={del} aria-label="Delete connector"><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <Input value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} placeholder="Name" />
          <select className={sel} value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })}>{CONNECTOR_CATEGORIES.map((x) => <option key={x}>{x}</option>)}</select>
          <Input value={meta.support_type} onChange={(e) => setMeta({ ...meta, support_type: e.target.value })} placeholder="How Saviynt integrates (dedicated connector, REST, JDBC…)" />
          <select className={sel} value={meta.difficulty} onChange={(e) => setMeta({ ...meta, difficulty: e.target.value })}>{["Beginner", "Intermediate", "Advanced", "Very high"].map((x) => <option key={x}>{x}</option>)}</select>
        </div>
        <Textarea className="mt-2" rows={2} value={meta.summary} onChange={(e) => setMeta({ ...meta, summary: e.target.value })} placeholder="Summary" />
        <Button size="sm" className="mt-2" onClick={saveMeta}>Save details</Button>
      </div>
      <div className={card}>
        <h3 className="mb-2 font-semibold">AI authoring</h3>
        <Textarea rows={2} value={guidance} onChange={(e) => setGuidance(e.target.value)} placeholder="Optional guidance, e.g. focus on LDAPS and group nesting" />
        <Button size="sm" className="mt-2" onClick={aiGenerate} disabled={busy}><Wand className="mr-1 h-4 w-4" />{busy ? "Writing (1–3 min)…" : "Generate full guide"}</Button>
      </div>
      <div className={card}>
        <h3 className="mb-2 font-semibold">Edit a section</h3>
        <p className="mb-2 text-xs text-muted-foreground">Architecture diagram, parameters, security, permissions, endpoint guide, import jobs, provisioning, troubleshooting, scenarios, lab exercises and interview questions are each editable here.</p>
        <select className={sel} value={section} onChange={(e) => pickSection(e.target.value as (typeof CONNECTOR_KEYS)[number])}>{CONNECTOR_KEYS.map((k) => <option key={k}>{k}</option>)}</select>
        <Textarea rows={18} className="mt-2 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
        <Button size="sm" className="mt-2" onClick={saveSection}>Save section</Button>
      </div>
    </div>
  );
}

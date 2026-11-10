import { createFileRoute, redirect } from "@tanstack/react-router";
import { useActivity } from "@/lib/stats";
import { useCurriculum } from "@/lib/curriculum";
import { PageHeader } from "@/components/AppShell";
import { Award, LockKeyhole } from "lucide-react";
import { Badge } from "@/components/ui/badge";
export const Route = createFileRoute("/_authenticated/certificates")({
  beforeLoad: () => { throw redirect({ to: "/dashboard" }); }, component: Certificates });
function Certificates(){
 const {data:a,isLoading}=useActivity();const {data:c}=useCurriculum();
 if(isLoading||!a||!c)return <p className="text-muted-foreground">Loading achievements…</p>;
 const done=new Set(a.progress.map(p=>p.lesson_id));
 const completed=c.modules.filter(m=>m.lessons.length>0&&m.lessons.every(l=>done.has(l.id)));
 const certAttempts=a.attempts.filter(x=>x.is_certification&&x.total>0&&x.score/x.total>=.7);
 return <div className="space-y-6"><PageHeader title="Certificates & Achievements" subtitle="Track completed learning milestones and qualifying practice-exam results."/>
 <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-xl border bg-card p-5"><Award className="mb-3 h-7 w-7 text-primary"/><p className="text-sm text-muted-foreground">Completed modules</p><p className="text-3xl font-semibold">{completed.length}</p></div><div className="rounded-xl border bg-card p-5"><Award className="mb-3 h-7 w-7 text-primary"/><p className="text-sm text-muted-foreground">Practice exams at 70%+</p><p className="text-3xl font-semibold">{certAttempts.length}</p></div></div>
 <section className="space-y-3"><h2 className="font-semibold">Learning milestones</h2>{c.modules.map(m=>{const complete=m.lessons.length>0&&m.lessons.every(l=>done.has(l.id));return <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"><div className="flex items-center gap-3"><Award className="h-5 w-5 text-primary"/><div><p className="font-medium">{m.title}</p><p className="text-xs text-muted-foreground">{m.lessons.filter(l=>done.has(l.id)).length}/{m.lessons.length} lessons completed</p></div></div><Badge variant={complete?"default":"outline"}>{complete?"Completed":"In progress"}</Badge></div>})}</section>
 <section className="rounded-xl border border-dashed p-4"><div className="flex items-center gap-2 font-medium"><LockKeyhole className="h-4 w-4"/>Official certificate issuance</div><p className="mt-1 text-sm text-muted-foreground">This page currently records portal learning achievements and qualifying practice exams. Downloadable portal-issued certificates and verification IDs will be introduced after the certificate format and issuance rules are approved. These achievements are not official Saviynt certifications.</p></section></div>;
}
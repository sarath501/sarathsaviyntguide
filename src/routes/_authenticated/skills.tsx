import { createFileRoute } from "@tanstack/react-router";
import { useActivity } from "@/lib/stats";
import { useCurriculum } from "@/lib/curriculum";
import { PageHeader } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
export const Route = createFileRoute("/_authenticated/skills")({ component: Skills });
function Skills() {
 const {data:activity,isLoading}=useActivity(); const {data:curriculum}=useCurriculum();
 if(isLoading||!activity||!curriculum) return <p className="text-muted-foreground">Loading skill assessment…</p>;
 const items=curriculum.modules.map(m=>{const attempts=activity.attempts.filter(a=>a.module_id===m.id);const score=attempts.length?Math.round(attempts.reduce((s,a)=>s+(a.score/Math.max(1,a.total))*100,0)/attempts.length):null;return {name:m.title,score,attempts:attempts.length};});
 const assessed=items.filter(x=>x.score!==null); const average=assessed.length?Math.round(assessed.reduce((s,x)=>s+(x.score??0),0)/assessed.length):0;
 return <div className="space-y-6"><PageHeader title="My Skills" subtitle="A learning-performance view derived from your existing quiz attempts. This is a study indicator, not a formal certification or competency validation." />
 <div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Topics assessed</p><p className="mt-1 text-2xl font-semibold">{assessed.length}/{items.length}</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Average quiz score</p><p className="mt-1 text-2xl font-semibold">{average}%</p></div><div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">Quiz attempts</p><p className="mt-1 text-2xl font-semibold">{activity.attempts.length}</p></div></div>
 <section className="space-y-4 rounded-xl border bg-card p-5"><h2 className="font-semibold">Topic performance</h2>{items.map(x=><div key={x.name} className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium">{x.name}</span>{x.score===null?<Badge variant="outline">Not assessed</Badge>:<span className="text-sm tabular-nums">{x.score}% · {x.attempts} attempt(s)</span>}</div><Progress value={x.score??0}/></div>)}</section>
 <p className="text-xs text-muted-foreground">Scores are calculated from quiz attempts already associated with each module. Topics without attempts are shown as not assessed rather than zero proficiency.</p></div>;
}
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useCurriculum } from "@/lib/curriculum";
import { computeStats, useActivity } from "@/lib/stats";
import { useProfile } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({ meta: [{ title: "Learning Center — Sarath IGA Learning Portal" }, { name: "description", content: "Saviynt IGA modules." }] }),
  component: Learn,
});

function Learn() {
  const { data } = useActivity();
  const { data: cur, isLoading } = useCurriculum();
  const { data: profile } = useProfile();
  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => (await supabase.from("bookmarks").select("lesson_id,created_at").order("created_at", { ascending: false })).data ?? [],
  });
  if (isLoading || !cur) return <p className="text-muted-foreground">Loading…</p>;
  const s = data ? computeStats(data, cur) : null;
  const resume = profile?.last_lesson_id ? cur.lessons.find((l) => l.id === profile.last_lesson_id) : undefined;
  const bm = (bookmarks ?? []).map((b) => cur.lessons.find((l) => l.id === b.lesson_id)).filter(Boolean);

  return (
    <div>
      <PageHeader title="Saviynt Learning Center" subtitle={`${cur.modules.length} modules · ${cur.lessons.length} in-depth lessons with diagrams, code and interview prep.`} />
      {(resume || bm.length > 0) && (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
          {resume && (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-hero p-5 text-navy-foreground">
              <div><p className="text-xs uppercase tracking-wider text-navy-muted">Resume where you stopped</p><p className="mt-1 font-semibold">{resume.title}</p></div>
              <Button asChild><Link to="/lesson/$lessonId" params={{ lessonId: resume.id }}><PlayCircle className="mr-1 h-4 w-4" />Resume</Link></Button>
            </div>
          )}
          {bm.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <p className="mb-2 flex items-center gap-1 text-sm font-semibold"><Bookmark className="h-4 w-4 text-primary" />Bookmarks</p>
              <ul className="space-y-1">{bm.slice(0, 5).map((l) => <li key={l!.id}><Link to="/lesson/$lessonId" params={{ lessonId: l!.id }} className="text-sm text-primary hover:underline">{l!.title}</Link></li>)}</ul>
            </div>
          )}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {cur.modules.map((m) => {
          const pct = s?.completion.find((c) => c.module === `M${m.num}`)?.pct ?? 0;
          return (
            <Link key={m.id} to="/learn/$moduleId" params={{ moduleId: m.id }} className="card-lift rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">MODULE {m.num}</span>
                <Badge variant="secondary">{m.level}</Badge>
              </div>
              <h3 className="mt-2 text-lg font-semibold">{m.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>
              <div className="mt-4 flex items-center gap-3"><Progress value={pct} /><span className="text-xs text-muted-foreground">{pct}%</span></div>
              <p className="mt-2 text-xs text-muted-foreground">{m.lessons.length} lessons · quiz</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

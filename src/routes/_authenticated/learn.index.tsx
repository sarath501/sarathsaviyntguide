import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { MODULES } from "@/lib/content";
import { computeStats, useActivity } from "@/lib/stats";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({ meta: [{ title: "Learning Center — Sarath IGA Learning Portal" }, { name: "description", content: "Saviynt IGA modules." }] }),
  component: Learn,
});

function Learn() {
  const { data } = useActivity();
  const s = data ? computeStats(data) : null;
  return (
    <div>
      <PageHeader title="Saviynt Learning Center" subtitle="Eleven modules from IAM fundamentals to advanced IGA." />
      <div className="grid gap-4 md:grid-cols-2">
        {MODULES.map((m) => {
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

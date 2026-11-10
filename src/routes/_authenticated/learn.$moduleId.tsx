import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ClipboardCheck, Network } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum";
import { useActivity } from "@/lib/stats";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/learn/$moduleId")({
  head: () => ({ meta: [{ title: "Module — Sarath IGA Learning Portal" }] }),
  component: ModulePage,
});

function ModulePage() {
  const { moduleId } = Route.useParams();
  const { data: cur, isLoading } = useCurriculum();
  const { data } = useActivity();
  const m = cur?.modules.find((x) => x.id === moduleId);

  if (isLoading || !cur) return <p className="text-muted-foreground">Loading…</p>;
  if (!m) return <p className="text-muted-foreground">Module not found.</p>;
  const done = new Set(data?.progress.map((p) => p.lesson_id));
  return (
    <div>
      <Link to="/learn" className="text-sm text-muted-foreground hover:text-foreground">← All modules</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Module {m.num}: {m.title}</h1>
          <p className="text-muted-foreground">{m.summary}</p>
        </div>
        <Button asChild variant="outline"><Link to="/quiz/$moduleId" params={{ moduleId: m.id }}><ClipboardCheck className="mr-1 h-4 w-4" />Module quiz</Link></Button>
      </div>
      <ol className="mt-6 space-y-3">
        {m.lessons.map((l, i) => (
          <li key={l.id}>
            <Link to="/lesson/$lessonId" params={{ lessonId: l.id }} className="card-lift flex items-start gap-4 rounded-xl border bg-card p-4 shadow-card">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-mono text-sm text-accent-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-medium">{l.title}{l.diagram_key && <Network className="h-3.5 w-3.5 text-primary" aria-label="Includes diagram" />}</span>
                <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">{l.summary}</span>
              </span>
              {done.has(l.id) ? <CheckCircle2 className="h-5 w-5 shrink-0 text-success" /> : <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { moduleById } from "@/lib/content";
import { QuizRunner, type Q } from "@/components/Quiz";

export const Route = createFileRoute("/_authenticated/quiz/$moduleId")({
  head: () => ({ meta: [{ title: "Module quiz — IGA Academy AI" }] }),
  component: QuizPage,
});

function QuizPage() {
  const { moduleId } = Route.useParams();
  const m = moduleById(moduleId);
  const { data, isLoading } = useQuery({
    queryKey: ["questions", moduleId],
    queryFn: async () => {
      const { data } = await supabase.from("quiz_questions").select("*").eq("module_id", moduleId);
      return (data ?? []) as unknown as Q[];
    },
  });
  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/learn/$moduleId" params={{ moduleId }} className="text-sm text-muted-foreground">← Back to module</Link>
      <h1 className="mb-6 mt-2 text-2xl font-semibold">Quiz: {m?.title}</h1>
      {isLoading ? <p>Loading…</p> : data && data.length ? <QuizRunner questions={data} moduleId={moduleId} /> : <p className="text-muted-foreground">No questions yet for this module.</p>}
    </div>
  );
}

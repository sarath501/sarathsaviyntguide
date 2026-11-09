import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bookmark, PlayCircle, Search, BookOpen, Filter, X } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useCurriculum } from "@/lib/curriculum";
import { computeStats, useActivity } from "@/lib/stats";
import { useProfile } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({ meta: [{ title: "Learning Center — Sarath IGA Learning Portal" }, { name: "description", content: "Search and explore Saviynt IGA learning modules and lessons." }] }),
  component: Learn,
});

function Learn() {
  const { data } = useActivity();
  const { data: cur, isLoading, error } = useCurriculum();
  const { data: profile } = useProfile();
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const { data: bookmarks } = useQuery({
    queryKey: ["bookmarks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookmarks").select("lesson_id,created_at").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const filteredModules = useMemo(() => {
    if (!cur) return [];
    const term = search.trim().toLowerCase();
    return cur.modules.map((module) => {
      const matchingLessons = module.lessons.filter((lesson) =>
        !term || `${lesson.title} ${lesson.summary}`.toLowerCase().includes(term),
      );
      const moduleMatches = !term || `${module.title} ${module.summary} ${module.level} module ${module.num}`.toLowerCase().includes(term);
      return { ...module, matchingLessons, moduleMatches };
    }).filter((module) =>
      (level === "all" || module.level.toLowerCase() === level) &&
      (!term || module.moduleMatches || module.matchingLessons.length > 0),
    );
  }, [cur, search, level]);

  if (isLoading) return <p className="text-muted-foreground" role="status">Loading learning modules…</p>;
  if (error || !cur) return <div className="rounded-xl border border-destructive/40 p-5"><h2 className="font-semibold">We couldn’t load the Learning Center</h2><p className="mt-1 text-sm text-muted-foreground">Refresh the page. If the problem continues, contact the portal administrator.</p></div>;

  const s = data ? computeStats(data, cur) : null;
  const resume = profile?.last_lesson_id ? cur.lessons.find((l) => l.id === profile.last_lesson_id) : undefined;
  const bm = (bookmarks ?? []).map((b) => cur.lessons.find((l) => l.id === b.lesson_id)).filter(Boolean);
  const resultCount = filteredModules.reduce((count, module) => count + (module.moduleMatches ? module.lessons.length : module.matchingLessons.length), 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Saviynt Learning Center" subtitle={`${cur.modules.length} modules · ${cur.lessons.length} lessons. Learn concepts, follow implementation steps and practise with examples.`} />
      {(resume || bm.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {resume && (
            <div className="flex items-center justify-between gap-3 rounded-xl border bg-hero p-5 text-navy-foreground">
              <div><p className="text-xs uppercase tracking-wider text-navy-muted">Continue where you left off</p><p className="mt-1 font-semibold">{resume.title}</p></div>
              <Button asChild><Link to="/lesson/$lessonId" params={{ lessonId: resume.id }}><PlayCircle className="mr-1 h-4 w-4" />Continue</Link></Button>
            </div>
          )}
          {bm.length > 0 && (
            <div className="rounded-xl border bg-card p-5 shadow-card">
              <p className="mb-2 flex items-center gap-1 text-sm font-semibold"><Bookmark className="h-4 w-4 text-primary" />Your saved lessons</p>
              <ul className="space-y-1">{bm.slice(0, 5).map((l) => <li key={l!.id}><Link to="/lesson/$lessonId" params={{ lessonId: l!.id }} className="text-sm text-primary hover:underline">{l!.title}</Link></li>)}</ul>
            </div>
          )}
        </div>
      )}

      <section className="rounded-xl border bg-card p-4 shadow-card" aria-label="Search and filter learning content">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search modules and lessons (e.g. access request, SoD, AD)…" className="pl-9 pr-9" aria-label="Search learning modules and lessons" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>}
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select className="h-10 min-w-40 rounded-md border bg-background px-3 text-sm" value={level} onChange={(event) => setLevel(event.target.value)} aria-label="Filter by difficulty">
              <option value="all">All levels</option>
              {[...new Set(cur.modules.map((module) => module.level.toLowerCase()))].map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">{search || level !== "all" ? `${filteredModules.length} modules · ${resultCount} matching lessons` : "Search by topic, connector, feature or keyword. Filter by learning level."}</p>
          {(search || level !== "all") && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setLevel("all"); }}>Clear filters</Button>}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredModules.map((m) => {
          const pct = s?.completion.find((c) => c.module === `M${m.num}`)?.pct ?? 0;
          const visibleLessons = search.trim() && !m.moduleMatches ? m.matchingLessons : m.lessons;
          return (
            <article key={m.id} className="rounded-xl border bg-card p-5 shadow-card transition hover:border-primary/40">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground">MODULE {m.num}</span>
                <Badge variant="secondary">{m.level}</Badge>
              </div>
              <h2 className="mt-2 text-lg font-semibold">{m.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{m.summary}</p>
              <div className="mt-4 flex items-center gap-3"><Progress value={pct} /><span className="text-xs tabular-nums text-muted-foreground">{pct}% complete</span></div>
              <p className="mt-2 text-xs text-muted-foreground">{m.lessons.length} lessons · module quiz</p>
              {visibleLessons.length > 0 && (
                <div className="mt-4 border-t pt-3">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><BookOpen className="h-3.5 w-3.5" />{search.trim() && !m.moduleMatches ? "Matching lessons" : "Lessons in this module"}</p>
                  <ul className="space-y-2">
                    {visibleLessons.slice(0, search.trim() && !m.moduleMatches ? 8 : 3).map((lesson) => (
                      <li key={lesson.id}><Link to="/lesson/$lessonId" params={{ lessonId: lesson.id }} className="text-sm text-primary hover:underline">{lesson.title}</Link></li>
                    ))}
                  </ul>
                  {visibleLessons.length > 3 && !(search.trim() && !m.moduleMatches) && <p className="mt-2 text-xs text-muted-foreground">And {visibleLessons.length - 3} more lessons</p>}
                </div>
              )}
              <div className="mt-4"><Button asChild variant="outline" size="sm"><Link to="/learn/$moduleId" params={{ moduleId: m.id }}>Open module <PlayCircle className="ml-2 h-4 w-4" /></Link></Button></div>
            </article>
          );
        })}
        {filteredModules.length === 0 && <div className="rounded-xl border border-dashed p-8 text-center md:col-span-2"><Search className="mx-auto h-7 w-7 text-muted-foreground" /><h2 className="mt-3 font-semibold">No matching learning content</h2><p className="mt-1 text-sm text-muted-foreground">Try another keyword or choose All levels.</p><Button variant="outline" className="mt-4" onClick={() => { setSearch(""); setLevel("all"); }}>Clear search and filters</Button></div>}
      </div>
    </div>
  );
}

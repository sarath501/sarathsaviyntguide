import { queryOptions, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LessonMeta = {
  id: string;
  module_id: string;
  position: number;
  title: string;
  summary: string;
  diagram_key: string | null;
  published: boolean;
};
export type ModuleRow = { id: string; num: number; title: string; level: string; summary: string; published: boolean };
export type Curriculum = { modules: (ModuleRow & { lessons: LessonMeta[] })[]; lessons: LessonMeta[] };

export const curriculumQuery = queryOptions({
  queryKey: ["curriculum"],
  queryFn: async (): Promise<Curriculum> => {
    const [m, l] = await Promise.all([
      supabase.from("modules").select("id,num,title,level,summary,published").order("num"),
      supabase.from("lessons").select("id,module_id,position,title,summary,diagram_key,published").order("position"),
    ]);
    if (m.error) throw m.error;
    if (l.error) throw l.error;
    const modules = (m.data ?? []).map((mod) => ({ ...mod, lessons: (l.data ?? []).filter((x) => x.module_id === mod.id) }));
    // Flat list in curriculum order (module, then position)
    const lessons = modules.flatMap((x) => x.lessons);
    return { modules, lessons };
  },
});

export function useCurriculum() {
  return useQuery(curriculumQuery);
}

export type LessonContent = {
  intro?: string;
  explanation?: string;
  concepts?: { term: string; detail: string }[];
  architecture?: string;
  steps?: { title: string; detail: string }[];
  useCases?: string[];
  examples?: string;
  code?: { language: string; title: string; code: string; note?: string; output?: { columns: string[]; rows: string[][] } | null }[];
  errors?: { error: string; cause: string; fix: string }[];
  troubleshooting?: string[];
  bestPractices?: string[];
  interview?: { q: string; a: string }[];
  exercises?: string[];
  takeaways?: string[];
  quiz?: { question: string; options: string[]; answer: number; explanation: string }[];
};

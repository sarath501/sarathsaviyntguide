CREATE TABLE public.community_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  category text NOT NULL DEFAULT 'Saviynt',
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_topics TO authenticated;
GRANT ALL ON public.community_topics TO service_role;
ALTER TABLE public.community_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read topics" ON public.community_topics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own topics" ON public.community_topics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners or admins update topics" ON public.community_topics FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owners or admins delete topics" ON public.community_topics FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.community_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES public.community_topics(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.community_replies(topic_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_replies TO authenticated;
GRANT ALL ON public.community_replies TO service_role;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read replies" ON public.community_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own replies" ON public.community_replies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners or admins delete replies" ON public.community_replies FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.lab_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lab_id text NOT NULL,
  completed_steps text[] NOT NULL DEFAULT '{}',
  diagnosis text NOT NULL DEFAULT '',
  score integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lab_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lab_progress TO authenticated;
GRANT ALL ON public.lab_progress TO service_role;
ALTER TABLE public.lab_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own lab progress" ON public.lab_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
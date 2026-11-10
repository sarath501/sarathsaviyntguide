CREATE TABLE public.learner_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 20000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.learner_notes(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_notes TO authenticated;
GRANT ALL ON public.learner_notes TO service_role;
ALTER TABLE public.learner_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes" ON public.learner_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
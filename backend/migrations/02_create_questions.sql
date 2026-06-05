-- Create questions table if not exists
CREATE TABLE IF NOT EXISTS public.questions (
  id TEXT PRIMARY KEY,
  language TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  prompt TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_index INT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and setup policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read questions" ON public.questions;
CREATE POLICY "Allow read questions" ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert questions" ON public.questions;
CREATE POLICY "Allow insert questions" ON public.questions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update questions" ON public.questions;
CREATE POLICY "Allow update questions" ON public.questions FOR UPDATE USING (true);

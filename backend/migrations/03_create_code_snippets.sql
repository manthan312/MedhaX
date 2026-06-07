-- Create code_snippets table
CREATE TABLE public.code_snippets (
    id VARCHAR(255) PRIMARY KEY,
    language VARCHAR(100) NOT NULL,
    topic VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    code_snippet TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    explanation TEXT
);

-- Index for querying by topic and language
CREATE INDEX idx_code_snippets_topic_lang ON public.code_snippets (topic, language);

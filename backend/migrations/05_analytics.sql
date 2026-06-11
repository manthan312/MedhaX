-- Create website_visits table
CREATE TABLE IF NOT EXISTS public.website_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create game_reviews table
CREATE TABLE IF NOT EXISTS public.game_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, user_id)
);

-- Disable Row Level Security (RLS) for these tracking tables
ALTER TABLE public.website_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_reviews DISABLE ROW LEVEL SECURITY;

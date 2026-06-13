-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

-- Add active_title column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_title TEXT DEFAULT NULL;

-- Disable Row Level Security (RLS) for the achievements table
ALTER TABLE public.user_achievements DISABLE ROW LEVEL SECURITY;

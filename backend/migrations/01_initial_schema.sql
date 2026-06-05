-- Users table (extends Insforge built-in auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  email_hash TEXT NOT NULL,
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email',
  flags JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Friendships table
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- User Stats table
CREATE TABLE public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_matches INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  ties INT DEFAULT 0,
  mmr INT DEFAULT 1200,
  avg_response_ms INT DEFAULT 0,
  streak INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT NOT NULL,
  topics TEXT[] NOT NULL,
  grid_size INT DEFAULT 5,
  question_ids_hash TEXT,
  rounds_played INT DEFAULT 0,
  winner_id UUID REFERENCES public.users(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  disconnect_flags JSONB DEFAULT '{}'::jsonb
);

-- Match Players table (since array of json in Postgres is harder to query, normalizing)
CREATE TABLE public.match_players (
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  final_score INT DEFAULT 0,
  response_stats JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (match_id, user_id)
);

-- Disable Row Level Security (RLS) since backend operates as secure administrator
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_players DISABLE ROW LEVEL SECURITY;

-- Policies for public.users
CREATE POLICY "Allow select for everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow insert for everyone" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for self" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Policies for public.friendships
CREATE POLICY "Users can read own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can insert own friendships" ON public.friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own friendships" ON public.friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can delete own friendships" ON public.friendships FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Policies for public.user_stats
CREATE POLICY "Users can read all stats" ON public.user_stats FOR SELECT USING (true);
CREATE POLICY "Users can insert own stats" ON public.user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own stats" ON public.user_stats FOR UPDATE USING (true);

-- Policies for public.matches
CREATE POLICY "Allow read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Allow insert matches" ON public.matches FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update matches" ON public.matches FOR UPDATE USING (true);

-- Policies for public.match_players
CREATE POLICY "Allow read match_players" ON public.match_players FOR SELECT USING (true);
CREATE POLICY "Allow insert match_players" ON public.match_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update match_players" ON public.match_players FOR UPDATE USING (true);

-- Questions table
CREATE TABLE public.questions (
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

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read questions" ON public.questions FOR SELECT USING (true);
CREATE POLICY "Allow insert questions" ON public.questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update questions" ON public.questions FOR UPDATE USING (true);

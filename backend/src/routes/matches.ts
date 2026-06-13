import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { JWT_SECRET } from '../config/env.js';

const router = Router();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (v: string) => UUID_REGEX.test(v);

// ─── GET /matches/history?userId= ────────────────────────────────────────────

router.get('/history', async (req: Request, res: Response) => {
  // Accept userId from query param OR from Bearer JWT token
  let userId = req.query['userId'] as string | undefined;

  if (!userId) {
    // Try to extract from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as Record<string, any>;
        userId = payload['sub'] ?? payload['id'];
      } catch {
        // Invalid token, fall through to error below
      }
    }
  }

  if (!userId || !isValidUUID(userId)) {
    res.status(400).json({ message: 'userId is required (via query param or valid Bearer token)' });
    return;
  }

  try {
    // 1. Fetch match IDs for the user
    const { data: playerMatches, error: pmError } = await supabaseAdmin.database
      .from('match_players')
      .select('match_id')
      .eq('user_id', userId);

    if (pmError) {
      res.status(500).json({ message: pmError.message });
      return;
    }

    const matchIds = (playerMatches ?? []).map(pm => pm.match_id);
    if (matchIds.length === 0) {
      res.json({ matches: [], playerHandles: {} });
      return;
    }

    // 2. Fetch the last 10 matches metadata
    const { data: matchesData, error: mError } = await supabaseAdmin.database
      .from('matches')
      .select('id, language, topics, grid_size, winner_id, started_at, ended_at, rounds_played, disconnect_flags')
      .in('id', matchIds)
      .order('started_at', { ascending: false })
      .limit(10);

    if (mError) {
      res.status(500).json({ message: mError.message });
      return;
    }

    const activeMatchIds = (matchesData ?? []).map(m => m.id);
    if (activeMatchIds.length === 0) {
      res.json({ matches: [], playerHandles: {} });
      return;
    }

    // 3. Fetch all players and scores for these matches
    const { data: allPlayersData, error: apError } = await supabaseAdmin.database
      .from('match_players')
      .select('match_id, user_id, final_score')
      .in('match_id', activeMatchIds);

    if (apError) {
      res.status(500).json({ message: apError.message });
      return;
    }

    // 4. Fetch handles for all players in these matches
    const playerIds = new Set<string>();
    for (const ap of allPlayersData ?? []) {
      playerIds.add(ap.user_id);
    }

    const handlesMap: Record<string, string> = {};
    if (playerIds.size > 0) {
      const { data: usersData, error: usersError } = await supabaseAdmin.database
        .from('users')
        .select('id, handle')
        .in('id', Array.from(playerIds));
      if (!usersError && usersData) {
        for (const u of usersData) {
          handlesMap[u.id] = u.handle;
        }
      }
    }

    // 5. Map to expected structure for the frontend
    const mappedMatches = (matchesData ?? []).map(m => {
      const playersInMatch = (allPlayersData ?? []).filter(ap => ap.match_id === m.id);
      const scores: Record<string, number> = {};
      const pids: string[] = [];
      for (const p of playersInMatch) {
        pids.push(p.user_id);
        scores[p.user_id] = p.final_score;
      }

      return {
        id: m.id,
        status: 'ended',
        winner_id: m.winner_id,
        config: {
          language: m.language,
          topics: m.topics ?? [],
          topic: m.topics?.[0] ?? '',
          gridSize: m.grid_size ?? 5,
          questionCount: m.rounds_played ?? 10
        },
        started_at: m.started_at,
        ended_at: m.ended_at,
        rounds_played: m.rounds_played ?? 0,
        disconnect_flags: m.disconnect_flags ?? {},
        scores,
        player_ids: pids
      };
    });

    res.json({ matches: mappedMatches, playerHandles: handlesMap });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /matches/:id  (Match Detail) ────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  if (!id || !isValidUUID(id)) {
    res.status(400).json({ message: 'Invalid match id' });
    return;
  }

  try {
    // Fetch match row
    const { data: match, error: mErr } = await supabaseAdmin.database
      .from('matches')
      .select('id, language, topics, grid_size, winner_id, started_at, ended_at, rounds_played, disconnect_flags')
      .eq('id', id)
      .single();

    if (mErr || !match) {
      res.status(404).json({ message: 'Match not found' });
      return;
    }

    // Fetch all players and their scores for this match
    const { data: playersData, error: pErr } = await supabaseAdmin.database
      .from('match_players')
      .select('user_id, final_score, response_stats')
      .eq('match_id', id);

    if (pErr) {
      res.status(500).json({ message: pErr.message });
      return;
    }

    // Fetch handles
    const playerIds = (playersData ?? []).map(p => p.user_id);
    const handlesMap: Record<string, string> = {};
    if (playerIds.length > 0) {
      const { data: usersData } = await supabaseAdmin.database
        .from('users')
        .select('id, handle')
        .in('id', playerIds);
      for (const u of usersData ?? []) {
        handlesMap[u.id] = u.handle;
      }
    }

    const scores: Record<string, number> = {};
    const responseStats: Record<string, any> = {};
    for (const p of playersData ?? []) {
      scores[p.user_id] = p.final_score;
      responseStats[p.user_id] = p.response_stats ?? {};
    }

    // Duration in seconds
    const durationSec = match.started_at && match.ended_at
      ? Math.round((new Date(match.ended_at).getTime() - new Date(match.started_at).getTime()) / 1000)
      : null;

    res.json({
      match: {
        id: match.id,
        status: 'ended',
        winner_id: match.winner_id,
        config: {
          language: match.language,
          topics: match.topics ?? [],
          topic: match.topics?.[0] ?? '',
          gridSize: match.grid_size ?? 5,
          questionCount: match.rounds_played ?? 10
        },
        started_at: match.started_at,
        ended_at: match.ended_at,
        rounds_played: match.rounds_played ?? 0,
        duration_sec: durationSec,
        disconnect_flags: match.disconnect_flags ?? {},
        scores,
        responseStats,
        player_ids: playerIds
      },
      playerHandles: handlesMap
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── GET /leaderboards?period=weekly|all-time ────────────────────────────────

router.get('/leaderboards', async (req: Request, res: Response) => {
  const period = (req.query['period'] as string | undefined) ?? 'all-time';

  try {
    let query = supabaseAdmin.database
      .from('leaderboard')
      .select('user_id, handle, wins, total_matches, win_rate')
      .order('wins', { ascending: false })
      .limit(100);

    if (period === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      query = supabaseAdmin.database
        .from('leaderboard_weekly')
        .select('user_id, handle, wins, total_matches, win_rate')
        .gte('period_start', weekAgo)
        .order('wins', { ascending: false })
        .limit(100);
    }

    const { data, error } = await query;

    if (error) {
      res.status(500).json({ message: (error as any).message });
      return;
    }

    res.json({ period, leaderboard: data ?? [] });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// In-memory registry of completed match recaps for recap screen
export const completedRecaps = new Map<string, any>();

router.get('/:id/recap', (req: Request, res: Response) => {
  const id = req.params['id'] as string;
  const recap = completedRecaps.get(id);
  if (!recap) {
    res.status(404).json({ message: 'Recap not found for this match' });
    return;
  }
  res.json(recap);
});

export default router;

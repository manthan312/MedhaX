import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../config/supabase.js';
import { JWT_SECRET } from '../config/env.js';

const router = Router();

// Middleware to authenticate any logged-in user
const requireAuth = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
    (req as any).userId = payload.sub ?? payload.id;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to authenticate specifically the admin user
const requireAdmin = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
    const userId = payload.sub ?? payload.id;
    if (userId === '00000000-0000-0000-0000-000000000000' || payload.email === 'admin31256@gmail.com') {
      (req as any).userId = userId;
      next();
    } else {
      res.status(403).json({ message: 'Forbidden' });
    }
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// ─── POST /analytics/visit ──────────────────────────────────────────────────
router.post('/visit', async (req: Request, res: Response) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400).json({ message: 'sessionId is required' });
    return;
  }

  try {
    const { error } = await supabaseAdmin.database
      .from('website_visits')
      .insert([{ session_id: sessionId }]);

    if (error) {
      console.error('[visit tracking error]:', error);
      res.status(500).json({ message: error.message });
      return;
    }

    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('[visit tracking exception]:', err);
    res.status(500).json({ message: err.message ?? 'Internal server error' });
  }
});

// ─── POST /analytics/review ─────────────────────────────────────────────────
router.post('/review', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const { matchId, rating, comment } = req.body;

  if (!matchId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    res.status(400).json({ message: 'matchId and a valid rating (1-5) are required' });
    return;
  }

  try {
    const { error } = await supabaseAdmin.database
      .from('game_reviews')
      .insert([{ 
        match_id: matchId, 
        user_id: userId, 
        rating, 
        comment 
      }]);

    if (error) {
      // Handle unique constraint (already reviewed)
      if (error.code === '23505') {
        res.status(409).json({ message: 'You have already reviewed this match.' });
        return;
      }
      console.error('[review submit error]:', error);
      res.status(500).json({ message: error.message });
      return;
    }

    res.status(201).json({ success: true });
  } catch (err: any) {
    console.error('[review submit exception]:', err);
    res.status(500).json({ message: err.message ?? 'Internal server error' });
  }
});

// ─── GET /analytics/dashboard ───────────────────────────────────────────────
router.get('/dashboard', requireAdmin, async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // 1. Fetch website visits (last 30 days)
    const { data: visits, error: vErr } = await supabaseAdmin.database
      .from('website_visits')
      .select('visited_at, session_id')
      .gte('visited_at', thirtyDaysAgoStr);

    if (vErr) throw vErr;

    // 2. Fetch matches (games played, last 30 days)
    const { data: matches, error: mErr } = await supabaseAdmin.database
      .from('matches')
      .select('started_at')
      .gte('started_at', thirtyDaysAgoStr);

    if (mErr) throw mErr;

    // 3. Fetch users registered (last 30 days)
    const { data: users, error: uErr } = await supabaseAdmin.database
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoStr);

    if (uErr) throw uErr;

    // 4. Fetch all user ratings and reviews
    const { data: reviews, error: rErr } = await supabaseAdmin.database
      .from('game_reviews')
      .select('created_at, rating, comment, user_id, match_id')
      .order('created_at', { ascending: false });

    if (rErr) throw rErr;

    // 5. Fetch user handles to map reviews to handles
    const reviewerIds = Array.from(new Set((reviews || []).map(r => r.user_id)));
    const handlesMap: Record<string, string> = {};
    if (reviewerIds.length > 0) {
      const { data: usersData } = await supabaseAdmin.database
        .from('users')
        .select('id, handle')
        .in('id', reviewerIds);

      for (const u of usersData || []) {
        handlesMap[u.id] = u.handle;
      }
    }

    // --- AGGREGATIONS ---

    // Format dates to YYYY-MM-DD
    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toISOString().split('T')[0];
    };

    // A. Daily Visits Graph (Count unique sessions per day)
    const visitsByDay: Record<string, Set<string>> = {};
    (visits || []).forEach(v => {
      const day = formatDate(v.visited_at);
      if (!visitsByDay[day]) visitsByDay[day] = new Set();
      visitsByDay[day].add(v.session_id);
    });
    const visitsDaily = Object.keys(visitsByDay).map(day => ({
      date: day,
      count: visitsByDay[day].size
    })).sort((a, b) => a.date.localeCompare(b.date));

    // B. Daily Games Played Graph
    const gamesByDay: Record<string, number> = {};
    (matches || []).forEach(m => {
      const day = formatDate(m.started_at);
      gamesByDay[day] = (gamesByDay[day] || 0) + 1;
    });
    const gamesDaily = Object.keys(gamesByDay).map(day => ({
      date: day,
      count: gamesByDay[day]
    })).sort((a, b) => a.date.localeCompare(b.date));

    // C. Daily User Registrations Graph
    const usersByDay: Record<string, number> = {};
    (users || []).forEach(u => {
      const day = formatDate(u.created_at);
      usersByDay[day] = (usersByDay[day] || 0) + 1;
    });
    const usersDaily = Object.keys(usersByDay).map(day => ({
      date: day,
      count: usersByDay[day]
    })).sort((a, b) => a.date.localeCompare(b.date));

    // D. User Ratings Distribution Graph (1-5 stars)
    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalRatingSum = 0;
    (reviews || []).forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating] += 1;
        totalRatingSum += r.rating;
      }
    });

    const averageRating = reviews && reviews.length > 0 
      ? parseFloat((totalRatingSum / reviews.length).toFixed(2)) 
      : 0;

    // E. Detailed review list with handles
    const detailedReviews = (reviews || []).map(r => ({
      matchId: r.match_id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      username: handlesMap[r.user_id] || 'Anonymous'
    }));

    res.json({
      summary: {
        totalVisits: (visits || []).length,
        totalGames: (matches || []).length,
        totalUsers: (users || []).length,
        totalReviews: (reviews || []).length,
        averageRating
      },
      graphs: {
        visitsDaily,
        gamesDaily,
        usersDaily,
        ratingDistribution: Object.keys(ratingDistribution).map(stars => ({
          stars: parseInt(stars, 10),
          count: ratingDistribution[parseInt(stars, 10)]
        }))
      },
      reviews: detailedReviews
    });
  } catch (err: any) {
    console.error('[analytics dashboard error]:', err);
    res.status(500).json({ message: err.message ?? 'Internal server error' });
  }
});

export default router;

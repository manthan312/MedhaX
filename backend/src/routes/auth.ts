import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { insforge, insforgeAdmin } from '../config/insforge.js';
import { JWT_SECRET } from '../config/env.js';

const router = Router();
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (value: string): boolean => UUID_REGEX.test(value);

// ─── POST /auth/signup ───────────────────────────────────────────────────────

router.post('/signup', async (req: Request, res: Response) => {
  const { email, password, username } = req.body as {
    email?: string;
    password?: string;
    username?: string;
  };

  if (!email || !password || !username) {
    res.status(400).json({ message: 'email, password and username are required' });
    return;
  }

  try {
    // 1. Create auth user
    const { data, error } = await insforge.auth.signUp({
      email,
      password,
      name: username,
    });

    if (error) {
      res.status(400).json({ message: (error as any).message ?? 'Signup failed' });
      return;
    }

    if (!data) {
      res.status(500).json({ message: 'No data returned from auth signup' });
      return;
    }

    // 2. Insert profile into users table
    const userId = (data as any).user?.id ?? (data as any).id;
    if (userId) {
      const emailHash = Buffer.from(email.trim().toLowerCase()).toString('base64');
      await insforgeAdmin.database
        .from('users')
        .insert([{ id: userId, handle: username, email_hash: emailHash }]);
    }

    const token = jwt.sign(
      { sub: userId, email, handle: username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: { id: userId, handle: username, username, email },
      token,
    });
  } catch (err: any) {
    console.error('[auth/signup]', err);
    res.status(500).json({ message: err.message ?? 'Internal server error' });
  }
});

// ─── POST /auth/login ────────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response) => {
  const { identifier, password } = req.body as {
    identifier?: string;
    password?: string;
  };

  if (!identifier || !password) {
    res.status(400).json({ message: 'identifier and password are required' });
    return;
  }

  try {
    const { data, error } = await insforge.auth.signInWithPassword({
      email: identifier,
      password,
    });

    if (error) {
      res.status(401).json({ message: (error as any).message ?? 'Login failed' });
      return;
    }

    if (!data) {
      res.status(500).json({ message: 'No data returned from login' });
      return;
    }

    const userId = (data as any).user?.id ?? (data as any).id;
    const userEmail = (data as any).user?.email ?? identifier;

    // Fetch user profile from DB
    const { data: dbUser } = await insforgeAdmin.database
      .from('users')
      .select('handle')
      .eq('id', userId)
      .maybeSingle();

    const username = (dbUser as any)?.handle ?? userEmail.split('@')[0];

    const token = jwt.sign(
      { sub: userId, email: userEmail, handle: username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: { id: userId, handle: username, username, email: userEmail },
      token,
    });
  } catch (err: any) {
    console.error('[auth/login]', err);
    res.status(500).json({ message: err.message ?? 'Internal server error' });
  }
});

// ─── GET /auth/me ─────────────────────────────────────────────────────────────

router.get('/me', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    // Verify the JWT signature
    const payload = jwt.verify(token, JWT_SECRET) as Record<string, any>;

    const userId: string | undefined = payload['sub'] ?? payload['id'];
    if (!userId || !isValidUUID(userId)) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    // Fetch user profile from DB
    const { data, error } = await insforgeAdmin.database
      .from('users')
      .select('id, handle, email_hash, created_at')
      .eq('id', userId);

    if (error) {
      res.status(500).json({ message: (error as any).message });
      return;
    }

    const user = Array.isArray(data) ? data[0] : data;
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Expose handle as both 'handle' and 'username' for client compatibility
    res.json({ user: { ...user, username: user.handle } });
  } catch (err: any) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// ─── PUT /auth/me/handle ──────────────────────────────────────────────────────

router.put('/me/handle', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const { newHandle } = req.body;

  if (!newHandle || typeof newHandle !== 'string' || newHandle.trim().length < 3) {
    res.status(400).json({ message: 'Handle must be at least 3 characters long' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as Record<string, any>;
    const userId = payload['sub'] ?? payload['id'];
    
    if (!userId || !isValidUUID(userId)) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }

    // Check uniqueness
    const { data: existing, error: checkErr } = await insforgeAdmin.database
      .from('users')
      .select('id')
      .eq('handle', newHandle.trim())
      .maybeSingle();

    if (checkErr) throw checkErr;
    if (existing && existing.id !== userId) {
      res.status(409).json({ message: 'Username is already taken' });
      return;
    }

    // Update handle
    const { error: updateErr } = await insforgeAdmin.database
      .from('users')
      .update({ handle: newHandle.trim() })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    res.json({ handle: newHandle.trim(), username: newHandle.trim() });
  } catch (err: any) {
    res.status(500).json({ message: err.message ?? 'Internal server error' });
  }
});

export default router;

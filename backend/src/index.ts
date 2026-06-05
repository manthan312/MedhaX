// ─── MedhaX Backend — Entry Point ────────────────────────────────────────────
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { PORT, JWT_SECRET } from './config/env.js';

import authRouter from './routes/auth.js';
import matchesRouter from './routes/matches.js';
import { usersRouter, friendsRouter } from './routes/friends.js';
import { registerMatchHandlers } from './sockets/matchSocket.js';
import { onlineUsers } from './config/online.js';
import { seedQuestions } from './data/seed.js';
import { insforgeAdmin } from './config/insforge.js';

// ─── Express App ──────────────────────────────────────────────────────────────

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── REST Routes ──────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'MedhaX Backend API is running.',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      friends: '/api/friends',
      matches: '/api/matches'
    }
  });
});

app.use('/api/auth',    authRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/users',   usersRouter);
app.use('/api/friends', friendsRouter);

// 404 fallthrough
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ─── HTTP + Socket.io Server ──────────────────────────────────────────────────

const httpServer = http.createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.set('io', io);

// ─── Socket.io Auth Middleware ────────────────────────────────────────────────

io.use((socket, next) => {
  const token =
    (socket.handshake.auth as any)?.token ||
    (socket.handshake.headers as any)?.authorization?.replace('Bearer ', '');

  if (!token) {
    // Allow unauthenticated in dev; remove in prod
    (socket as any).userId = `anon_${socket.id}`;
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as Record<string, any>;
    (socket as any).userId = payload['sub'] ?? payload['id'] ?? `anon_${socket.id}`;
    next();
  } catch (err) {
    next(new Error('Authentication failed: invalid token'));
  }
});

// ─── Register Socket Handlers ─────────────────────────────────────────────────

async function broadcastStatus(userId: string, online: boolean) {
  try {
    const { data: friendships } = await insforgeAdmin.database
      .from('friendships')
      .select('user_id, friend_id')
      .eq('status', 'accepted')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (!friendships) return;

    for (const f of friendships) {
      const friendId = f.user_id === userId ? f.friend_id : f.user_id;
      const friendSockets = onlineUsers.get(friendId);
      if (friendSockets) {
        for (const socketId of friendSockets) {
          io.to(socketId).emit('friend.status', { friendId: userId, online });
        }
      }
    }
  } catch (err) {
    console.error('[broadcastStatus] error:', err);
  }
}

io.on('connection', (socket) => {
  const userId = (socket as any).userId as string;
  console.log(`[socket] connected: ${socket.id}  userId: ${userId}`);

  // Track online status if authenticated
  if (userId && !userId.startsWith('anon_')) {
    let wasOffline = false;
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
      wasOffline = true;
    }
    onlineUsers.get(userId)!.add(socket.id);

    if (wasOffline) {
      broadcastStatus(userId, true);
    }
  }

  registerMatchHandlers(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id}  reason: ${reason}`);
    
    // Remove from online status
    if (userId && !userId.startsWith('anon_')) {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
          broadcastStatus(userId, false);
        }
      }
    }
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, async () => {
  console.log(`✅ MedhaX backend listening on http://localhost:${PORT}`);
  console.log(`   REST  → /api/{auth|matches|users|friends}`);
  console.log(`   WS    → socket.io`);

  // Seed questions if empty
  await seedQuestions();
});

export { app, io, httpServer };

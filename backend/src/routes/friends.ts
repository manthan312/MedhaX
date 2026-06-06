import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { insforgeAdmin } from '../config/insforge.js';
import { isOnline, getOnlineUserIds, onlineUsers } from '../config/online.js';
import { JWT_SECRET } from '../config/env.js';

interface AuthenticatedRequest extends Request {
  userId?: string;
}

// ─── UUID Validation Helper ───────────────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (value: string): boolean => UUID_REGEX.test(value);

// ─── Auth Middleware ──────────────────────────────────────────────────────────
const requireAuth = (req: AuthenticatedRequest, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as Record<string, any>;
    const userId = payload['sub'] ?? payload['id'];
    if (!userId) {
      res.status(401).json({ message: 'Invalid token payload' });
      return;
    }
    if (!isValidUUID(userId)) {
      res.status(401).json({ message: 'Invalid token: user id is not a valid UUID' });
      return;
    }
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ─── Users Router ─────────────────────────────────────────────────────────────
const usersRouter = Router();

// GET /users/search?q=  — returns all users (or filtered), excluding self
usersRouter.get('/search', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const q = (req.query['q'] as string | undefined)?.trim();
  const myUserId = req.userId!;

  try {
    let query = insforgeAdmin.database.from('users').select('id, handle');

    if (q && q.length >= 1) {
      query = query.ilike('handle', `%${q}%`);
    }

    const { data, error } = await query.limit(16);

    if (error) {
      console.error('[users/search] DB error:', error);
      res.status(500).json({ message: (error as any).message });
      return;
    }

    const users = (data ?? [])
      .filter(u => u.id !== myUserId)
      .slice(0, 15)
      .map(u => ({
        id: u.id,
        handle: u.handle,
        online: isOnline(u.id),
      }));

    res.json({ users });
  } catch (err: any) {
    console.error('[users/search] error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /users/online — returns all currently online users (excluding self)
usersRouter.get('/online', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const myUserId = req.userId!;
  const onlineIds = getOnlineUserIds().filter(id => id !== myUserId);

  if (onlineIds.length === 0) {
    res.json({ users: [] });
    return;
  }

  try {
    const { data, error } = await insforgeAdmin.database
      .from('users')
      .select('id, handle')
      .in('id', onlineIds);

    if (error) {
      res.status(500).json({ message: (error as any).message });
      return;
    }

    const users = (data ?? []).map(u => ({
      id: u.id,
      handle: u.handle,
      online: true,
    }));

    res.json({ users });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export { usersRouter };

// ─── Friends Router ───────────────────────────────────────────────────────────
const friendsRouter = Router();

// POST /friends/request — send a friend request
friendsRouter.post('/request', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const fromUserId = req.userId!;
  const { to_user_id: toUserId } = req.body as { to_user_id?: string };

  if (!toUserId) {
    res.status(400).json({ message: 'to_user_id is required' });
    return;
  }
  if (fromUserId === toUserId) {
    res.status(400).json({ message: 'Cannot send friend request to yourself' });
    return;
  }

  try {
    // Check if friendship or request already exists in either direction
    const { data: existing, error: checkError } = await insforgeAdmin.database
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${fromUserId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${fromUserId})`)
      .maybeSingle();

    if (checkError) {
      console.error('[friends/request] check error:', checkError);
      res.status(500).json({ message: checkError.message });
      return;
    }

    if (existing) {
      if (existing.status === 'accepted') {
        res.status(400).json({ message: 'Already friends' });
        return;
      }
      if (existing.status === 'pending') {
        if (existing.user_id === fromUserId) {
          // I already sent the request — idempotent, just say ok
          res.status(200).json({ message: 'Friend request already sent', already_pending: true });
          return;
        } else {
          // Other user had already sent ME a request → auto-accept
          const { error: acceptError } = await insforgeAdmin.database
            .from('friendships')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', existing.id);

          if (acceptError) {
            res.status(500).json({ message: acceptError.message });
            return;
          }

          // Notify the original sender that their request was accepted
          const io = req.app.get('io');
          if (io) {
            const targetSockets = onlineUsers.get(toUserId);
            if (targetSockets) {
              for (const socketId of targetSockets) {
                io.to(socketId).emit('friend.request.accepted', {
                  friend_id: fromUserId,
                  friendship_id: existing.id,
                });
              }
            }
            // Also notify me (the accepter)
            const mySockets = onlineUsers.get(fromUserId);
            if (mySockets) {
              for (const socketId of mySockets) {
                io.to(socketId).emit('friend.request.accepted', {
                  friend_id: toUserId,
                  friendship_id: existing.id,
                });
              }
            }
          }

          res.status(200).json({ message: 'Friend request accepted automatically (mutual)' });
          return;
        }
      }
    }

    // Insert new pending request
    const { data: inserted, error: insertError } = await insforgeAdmin.database
      .from('friendships')
      .insert([{
        user_id: fromUserId,
        friend_id: toUserId,
        status: 'pending',
      }])
      .select('id')
      .maybeSingle();

    if (insertError) {
      console.error('[friends/request] insert error:', insertError);
      res.status(500).json({ message: insertError.message });
      return;
    }

    // Real-time: notify the target user about the new request
    const io = req.app.get('io');
    if (io) {
      const targetSockets = onlineUsers.get(toUserId);
      if (targetSockets) {
        for (const socketId of targetSockets) {
          io.to(socketId).emit('friend.request.received', {
            from_user_id: fromUserId,
            friendship_id: (inserted as any)?.id,
          });
        }
      }
    }

    res.status(201).json({ message: 'Friend request sent successfully' });
  } catch (err: any) {
    console.error('[friends/request] error:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST /friends/respond — accept or decline a friend request
friendsRouter.post('/respond', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { friendship_id: friendshipId, accept } = req.body as {
    friendship_id?: string;
    accept?: boolean;
  };

  if (!friendshipId || accept === undefined) {
    res.status(400).json({ message: 'friendship_id and accept (boolean) are required' });
    return;
  }

  try {
    const { data: request, error: fetchError } = await insforgeAdmin.database
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .maybeSingle();

    if (fetchError || !request) {
      res.status(404).json({ message: 'Friend request not found' });
      return;
    }

    // Only the intended recipient can respond
    if (request.friend_id !== userId) {
      res.status(403).json({ message: 'You are not the recipient of this request' });
      return;
    }

    if (accept) {
      const { error: updateError } = await insforgeAdmin.database
        .from('friendships')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', friendshipId);

      if (updateError) {
        res.status(500).json({ message: updateError.message });
        return;
      }

      // Notify requester that their request was accepted
      const io = req.app.get('io');
      if (io) {
        const requesterId = request.user_id;
        const requesterSockets = onlineUsers.get(requesterId);
        if (requesterSockets) {
          for (const socketId of requesterSockets) {
            io.to(socketId).emit('friend.request.accepted', {
              friend_id: userId,
              friendship_id: friendshipId,
            });
          }
        }
        // Notify accepter too (so their UI updates)
        const mySocketsSet = onlineUsers.get(userId);
        if (mySocketsSet) {
          for (const socketId of mySocketsSet) {
            io.to(socketId).emit('friend.request.accepted', {
              friend_id: requesterId,
              friendship_id: friendshipId,
            });
          }
        }
      }

      res.json({ message: 'Friend request accepted' });
    } else {
      // Decline: delete the request record
      const { error: deleteError } = await insforgeAdmin.database
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (deleteError) {
        res.status(500).json({ message: deleteError.message });
        return;
      }

      // Notify requester of decline
      const io = req.app.get('io');
      if (io) {
        const requesterId = request.user_id;
        const requesterSockets = onlineUsers.get(requesterId);
        if (requesterSockets) {
          for (const socketId of requesterSockets) {
            io.to(socketId).emit('friend.request.declined', {
              friend_id: userId,
              friendship_id: friendshipId,
            });
          }
        }
      }

      res.json({ message: 'Friend request declined' });
    }
  } catch (err: any) {
    console.error('[friends/respond] error:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET /friends — returns accepted friends + incoming pending + outgoing pending
friendsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;

  try {
    // 1. Fetch ALL friendships involving this user
    const { data: allRecords, error: allError } = await insforgeAdmin.database
      .from('friendships')
      .select('id, user_id, friend_id, status, created_at')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (allError) {
      console.error('[GET /friends] DB error:', allError);
      res.status(500).json({ message: allError.message });
      return;
    }

    const records = allRecords ?? [];

    // Partition into accepted, pending-received, pending-sent
    const acceptedRecords = records.filter(r => r.status === 'accepted');
    const pendingReceived = records.filter(r => r.status === 'pending' && r.friend_id === userId);
    const pendingSent     = records.filter(r => r.status === 'pending' && r.user_id === userId);

    // Collect all relevant user IDs to fetch in one query
    const allUserIds = new Set<string>();
    for (const r of acceptedRecords) {
      allUserIds.add(r.user_id === userId ? r.friend_id : r.user_id);
    }
    for (const r of pendingReceived) allUserIds.add(r.user_id);
    for (const r of pendingSent)     allUserIds.add(r.friend_id);

    // Batch fetch user profiles
    let userMap: Record<string, { id: string; handle: string }> = {};
    if (allUserIds.size > 0) {
      const { data: usersData } = await insforgeAdmin.database
        .from('users')
        .select('id, handle')
        .in('id', [...allUserIds]);

      for (const u of usersData ?? []) {
        userMap[u.id] = u;
      }
    }

    // Build accepted friends list
    const friends = acceptedRecords.map(r => {
      const friendUserId = r.user_id === userId ? r.friend_id : r.user_id;
      const u = userMap[friendUserId];
      return {
        id: friendUserId,
        handle: u?.handle ?? 'Unknown',
        online: isOnline(friendUserId),
        friendship_id: r.id,
      };
    });

    // Build incoming pending requests (I can accept/decline)
    const pending = pendingReceived.map(r => {
      const u = userMap[r.user_id];
      return {
        id: r.user_id,
        handle: u?.handle ?? 'Unknown',
        friendship_id: r.id,
        created_at: r.created_at,
      };
    });

    // Build outgoing pending requests (I sent, waiting)
    const sentRequests = pendingSent.map(r => {
      const u = userMap[r.friend_id];
      return {
        id: r.friend_id,
        handle: u?.handle ?? 'Unknown',
        friendship_id: r.id,
        created_at: r.created_at,
      };
    });

    res.json({ friends, pending, sentRequests });
  } catch (err: any) {
    console.error('[GET /friends] error:', err);
    res.status(500).json({ message: err.message });
  }
});

export { friendsRouter };
export default friendsRouter;

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let activeToken: string | null = null;

let clockOffset = 0; // serverTime - clientTime
let lowestRtt = Infinity;
let syncInterval: any = null;

export function syncClock(): void {
  if (!socket || !socket.connected) return;
  const start = Date.now();
  socket.emit('time.sync', { clientTime: start });
  socket.once('time.sync.ack', (data: { clientTime: number; serverTime: number }) => {
    const end = Date.now();
    const rtt = end - data.clientTime;
    const offset = data.serverTime - (end - rtt / 2);
    
    if (rtt < lowestRtt) {
      lowestRtt = rtt;
      clockOffset = offset;
      console.log('[clock] sync complete (new lowest RTT). Offset:', clockOffset, 'ms (RTT:', rtt, 'ms)');
    } else {
      // Small adjustment towards new measurement to handle clock drift over time
      clockOffset = clockOffset * 0.9 + offset * 0.1;
    }
  });
}

export function getSyncedTime(): number {
  return Date.now() + clockOffset;
}

export function initSocket(token: string): Socket {
  if (socket && token === activeToken) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  activeToken = token;
  socket = io(import.meta.env.VITE_API_URL ?? 'https://medhax-api-72177c54-e7fc-45e9-812e-ab418b203870.fly.dev', {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  socket.on('connect', () => {
    console.log('[socket] connected', socket?.id);
    lowestRtt = Infinity;
    syncClock();
    
    // Multiple quick initial syncs to establish a robust offset
    setTimeout(syncClock, 500);
    setTimeout(syncClock, 1500);
    setTimeout(syncClock, 3000);
    
    if (!syncInterval) {
      syncInterval = setInterval(() => {
        syncClock();
      }, 10000); // sync every 10 seconds
    }
  });
  socket.on('disconnect', (r: string) => {
    console.log('[socket] disconnected', r);
  });
  socket.on('connect_error', (e: Error) => console.error('[socket] error', e.message));
  return socket;
}

export function getSocket(): Socket | null { return socket; }
export function disconnectSocket(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  socket?.disconnect();
  socket = null;
  activeToken = null;
}

export const emit = (event: string, data: unknown) => socket?.emit(event, data);

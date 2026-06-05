import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
let activeToken: string | null = null;

export function initSocket(token: string): Socket {
  if (socket && token === activeToken) {
    return socket;
  }
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeToken = token;
  socket = io(import.meta.env.VITE_API_URL ?? 'https://medhax-api-72177c54-e7fc-45e9-812e-ab418b203870.fly.dev', {
    transports: ['websocket'],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  socket.on('connect', () => console.log('[socket] connected', socket?.id));
  socket.on('disconnect', (r: string) => console.log('[socket] disconnected', r));
  socket.on('connect_error', (e: Error) => console.error('[socket] error', e.message));
  return socket;
}

export function getSocket(): Socket | null { return socket; }
export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
  activeToken = null;
}

export const emit = (event: string, data: unknown) => socket?.emit(event, data);

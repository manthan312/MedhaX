import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'https://medhax-api-72177c54-e7fc-45e9-812e-ab418b203870.fly.dev';

// ─── Typed Event Payloads ────────────────────────────────────────────────────

export interface JoinLobbyPayload {
  matchId?: string;
  friendId?: string;
}

export interface SendReadyPayload {
  matchId: string;
  language: string;
  topics: string[];
}

export interface LockPlacementPayload {
  matchId: string;
  placements: Array<{
    shapeId: string;
    anchor: { x: number; y: number };
    cells: Array<{ x: number; y: number }>;
  }>;
}

export interface SubmitAnswerPayload {
  matchId: string;
  questionId: string;
  answer: string;
  timeToAnswerMs: number;
}

export interface SubmitDigPayload {
  matchId: string;
  x: number;
  y: number;
}

export interface RequestHintPayload {
  matchId: string;
  questionId: string;
}

// ─── Singleton Socket Service ────────────────────────────────────────────────

let socketInstance: Socket | null = null;

/**
 * Initialize and connect the Socket.io singleton with JWT auth.
 */
export function initSocket(token: string): Socket {
  if (socketInstance?.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: { token },
  });

  socketInstance.on('connect', () => {
    console.log('[Socket] Connected — ID:', socketInstance?.id);
  });

  socketInstance.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socketInstance.on('connect_error', (err) => {
    console.error('[Socket] Connection error:', err.message);
  });

  socketInstance.on('reconnect', (attempt) => {
    console.log('[Socket] Reconnected after', attempt, 'attempts');
  });

  return socketInstance;
}

/**
 * Return the current socket instance (or null if not initialized).
 */
export function getSocket(): Socket | null {
  return socketInstance;
}

/**
 * Cleanly disconnect the socket singleton.
 */
export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    console.log('[Socket] Disconnected and cleared.');
  }
}

// ─── Typed Event Emitters ────────────────────────────────────────────────────

export function joinLobby(payload: JoinLobbyPayload): void {
  socketInstance?.emit('lobby.join', payload);
}

export function sendReady(payload: SendReadyPayload): void {
  socketInstance?.emit('lobby.ready', payload);
}

export function lockPlacement(payload: LockPlacementPayload): void {
  socketInstance?.emit('placement.lock', payload);
}

export function submitAnswer(payload: SubmitAnswerPayload): void {
  socketInstance?.emit('answer.submit', payload);
}

export function submitDig(payload: SubmitDigPayload): void {
  socketInstance?.emit('dig.submit', payload);
}

export function requestHint(payload: RequestHintPayload): void {
  socketInstance?.emit('hint.request', payload);
}

// ─── Legacy class-based wrapper (backward compat) ───────────────────────────
class SocketServiceCompat {
  get socket(): Socket | null {
    return socketInstance;
  }

  async connect() {
    // No-op; use initSocket(token) instead
    console.warn('[SocketService] Use initSocket(token) from socket.ts instead.');
  }

  disconnect() {
    disconnectSocket();
  }

  emit(event: string, data: unknown) {
    socketInstance?.emit(event, data);
  }

  emitTelemetry(signal: string, data: unknown) {
    socketInstance?.emit('telemetry_signal', {
      signal,
      data,
      timestamp: Date.now(),
    });
  }

  on(event: string, callback: (...args: any[]) => void) {
    socketInstance?.on(event, callback);
  }

  off(event: string) {
    socketInstance?.off(event);
  }
}

export default new SocketServiceCompat();

import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const SOCKET_URL = 'http://localhost:3000'; // Replace with backend URL

class SocketService {
  public socket: Socket | null = null;

  async connect() {
    if (this.socket?.connected) return;

    const token = await SecureStore.getItemAsync('auth_token');

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Send non-blocking telemetry events for anti-cheat signaling.
   */
  emitTelemetry(signal: string, data: any) {
    if (this.socket) {
      this.socket.emit('telemetry_signal', {
        signal,
        data,
        timestamp: Date.now(),
      });
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }
}

export default new SocketService();

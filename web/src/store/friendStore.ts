import { create } from 'zustand';
import axios, { AxiosError } from 'axios';
import { useAuthStore } from './authStore';

const API = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000') + '/api';

export interface Friend {
  id: string;
  handle: string;
  online?: boolean;
  friendship_id?: string;
}

export interface FriendRequest {
  id: string;           // sender's user ID
  handle: string;
  friendship_id: string;
  created_at: string;
}

export interface SentRequest {
  id: string;           // recipient's user ID
  handle: string;
  friendship_id: string;
  created_at: string;
}

interface FriendState {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: SentRequest[];
  searchResults: Friend[];
  isLoading: boolean;
  fetchFriends: () => Promise<void>;
  searchUsers: (q: string) => Promise<void>;
  sendRequest: (userId: string) => Promise<{ already_pending?: boolean }>;
  respondRequest: (friendshipId: string, accept: boolean) => Promise<void>;
  setFriendOnline: (friendId: string, online: boolean) => void;
}

function getToken(): string | null {
  return useAuthStore.getState().token;
}

function getHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** If we get a 401/403, force logout so the app clears stale tokens */
function handle401(err: unknown) {
  const axiosErr = err as AxiosError;
  const status = axiosErr?.response?.status;
  if (status === 401 || status === 403) {
    console.warn('[friendStore] Token rejected by server — logging out');
    useAuthStore.getState().logout();
  }
}

export const useFriendStore = create<FriendState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  searchResults: [],
  isLoading: false,

  fetchFriends: async () => {
    const token = getToken();
    if (!token) return;   // Not logged in — skip silently
    try {
      const res = await axios.get(`${API}/friends`, { headers: getHeaders() });
      set({
        friends: res.data.friends ?? [],
        pendingRequests: res.data.pending ?? [],
        sentRequests: res.data.sentRequests ?? [],
      });
    } catch (err: any) {
      handle401(err);
      // Don't log noisy errors for network issues
    }
  },

  searchUsers: async (q: string) => {
    const token = getToken();
    if (!token) return;   // Not logged in — skip silently
    set({ isLoading: true });
    try {
      const trimmed = q.trim();
      const url = trimmed.length > 0
        ? `${API}/users/search?q=${encodeURIComponent(trimmed)}`
        : `${API}/users/search`;
      const res = await axios.get(url, { headers: getHeaders() });
      set({ searchResults: res.data.users ?? [], isLoading: false });
    } catch (err: any) {
      handle401(err);
      set({ searchResults: [], isLoading: false });
    }
  },

  sendRequest: async (userId: string) => {
    const res = await axios.post(
      `${API}/friends/request`,
      { to_user_id: userId },
      { headers: getHeaders() }
    );
    await get().fetchFriends();
    return res.data;
  },

  respondRequest: async (friendshipId: string, accept: boolean) => {
    await axios.post(
      `${API}/friends/respond`,
      { friendship_id: friendshipId, accept },
      { headers: getHeaders() }
    );
    await get().fetchFriends();
  },

  setFriendOnline: (friendId: string, online: boolean) => {
    set(state => ({
      friends: state.friends.map(f => f.id === friendId ? { ...f, online } : f),
      searchResults: state.searchResults.map(u => u.id === friendId ? { ...u, online } : u),
    }));
  },
}));

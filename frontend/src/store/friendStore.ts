import { create } from 'zustand';
import api from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  elo?: number;
  isOnline?: boolean;
}

export interface FriendRequest {
  id: string;
  fromUser: User;
  toUser: User;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

// ─── State Shape ─────────────────────────────────────────────────────────────

interface FriendState {
  friends: User[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  searchResults: User[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

interface FriendActions {
  fetchFriends: () => Promise<void>;
  fetchPendingRequests: () => Promise<void>;
  searchUsers: (query: string) => Promise<void>;
  clearSearch: () => void;
  sendFriendRequest: (userId: string) => Promise<void>;
  respondToRequest: (requestId: string, accept: boolean) => Promise<void>;
  setFriendOnline: (userId: string, online: boolean) => void;
  addIncomingRequest: (request: FriendRequest) => void;
  clearError: () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useFriendStore = create<FriendState & FriendActions>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  searchResults: [],
  isLoading: false,
  isSearching: false,
  error: null,

  fetchFriends: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/friends');
      set({
        friends: res.data.friends ?? [],
        pendingRequests: res.data.pending ?? [],
        sentRequests: res.data.sentRequests ?? [],
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to load friends.', isLoading: false });
    }
  },

  fetchPendingRequests: async () => {
    // Handled dynamically as part of fetchFriends for the backend API model
  },

  searchUsers: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    set({ isSearching: true });
    try {
      const res = await api.get('/users/search', { params: { q: query } });
      set({ searchResults: res.data.users ?? [], isSearching: false });
    } catch (err: any) {
      set({ isSearching: false, error: err.response?.data?.message || 'Search failed.' });
    }
  },

  clearSearch: () => set({ searchResults: [] }),

  sendFriendRequest: async (userId: string) => {
    try {
      await api.post('/friends/request', { to_user_id: userId });
      await get().fetchFriends();
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to send friend request.' });
      throw err;
    }
  },

  respondToRequest: async (requestId: string, accept: boolean) => {
    try {
      await api.post('/friends/respond', { friendship_id: requestId, accept });
      await get().fetchFriends();
    } catch (err: any) {
      set({ error: err.response?.data?.message || 'Failed to respond to request.' });
      throw err;
    }
  },

  setFriendOnline: (userId: string, online: boolean) => {
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === userId ? { ...f, isOnline: online } : f
      ),
    }));
  },

  addIncomingRequest: (request: FriendRequest) => {
    set((state) => ({
      pendingRequests: [request, ...state.pendingRequests],
    }));
  },

  clearError: () => set({ error: null }),
}));

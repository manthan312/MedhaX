import { create } from 'zustand';
import axios from 'axios';

const API = (import.meta.env.VITE_API_URL ?? 'https://medhax-api-72177c54-e7fc-45e9-812e-ab418b203870.fly.dev') + '/api';

export interface User {
  id: string;
  handle: string;
  email?: string;
  email_hash?: string;
  avatar_url?: string;
  created_at?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  validateToken: () => Promise<boolean>;
}

function loadFromStorage() {
  try {
    const token = localStorage.getItem('medhax_token');
    const user = JSON.parse(localStorage.getItem('medhax_user') || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

const { token: storedToken, user: storedUser } = loadFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!(storedToken && storedUser),
  isLoading: false,
  error: null,

  validateToken: async (): Promise<boolean> => {
    const { token } = get();
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false });
      return false;
    }
    try {
      const res = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Token is valid — update user in case DB data changed
      const freshUser = res.data.user;
      if (freshUser) {
        localStorage.setItem('medhax_user', JSON.stringify(freshUser));
        set({ user: freshUser, isAuthenticated: true });
      }
      return true;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        // Token is invalid or expired → force logout
        console.warn('[authStore] Token invalid/expired — logging out');
        localStorage.removeItem('medhax_token');
        localStorage.removeItem('medhax_user');
        set({ user: null, token: null, isAuthenticated: false });
        return false;
      }
      // Network error — don't log out, just treat as still valid
      return true;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API}/auth/login`, { identifier: email, password });
      const { user, token } = res.data;
      localStorage.setItem('medhax_token', token);
      localStorage.setItem('medhax_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  signup: async (email, password, username) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API}/auth/signup`, { email, password, username });
      const { user, token } = res.data;
      if (token) {
        localStorage.setItem('medhax_token', token);
        localStorage.setItem('medhax_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      } else {
        set({ isLoading: false });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Signup failed. Try a different email.';
      set({ error: msg, isLoading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('medhax_token');
    localStorage.removeItem('medhax_user');
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

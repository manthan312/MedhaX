import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import api from '../services/api';

const tokenStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {}
  },
  deleteItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  }
};

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  elo?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (identifier: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // Helpers
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (identifier, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const { user, token } = response.data;

      await tokenStorage.setItem('auth_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Login failed. Please check your credentials.',
        isLoading: false,
      });
      throw err;
    }
  },

  signup: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/signup', { username, email, password });
      const { user, token } = response.data;

      await tokenStorage.setItem('auth_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({
        error: err.response?.data?.message || 'Signup failed. Please try again.',
        isLoading: false,
      });
      throw err;
    }
  },

  logout: async () => {
    await tokenStorage.deleteItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = await tokenStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await api.get('/auth/me');
        set({ user: response.data.user, token, isAuthenticated: true, isLoading: false });
      } catch {
        await tokenStorage.deleteItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

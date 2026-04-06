import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
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
      
      await SecureStore.setItemAsync('auth_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Login failed. Please check your credentials.', 
        isLoading: false 
      });
      throw err;
    }
  },

  signup: async (username, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/signup', { username, email, password });
      const { user, token } = response.data;
      
      await SecureStore.setItemAsync('auth_token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.message || 'Signup failed. Please try again.', 
        isLoading: false 
      });
      throw err;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      try {
        // Optional: verify token with backend
        const response = await api.get('/auth/me'); 
        set({ user: response.data.user, token, isAuthenticated: true });
      } catch (err) {
        // Token invalid/expired
        await SecureStore.deleteItemAsync('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },

  clearError: () => set({ error: null }),
}));

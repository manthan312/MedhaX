import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://medhax-api-72177c54-e7fc-45e9-812e-ab418b203870.fly.dev/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT token from zustand authStore
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[API] 401 Unauthorized — session expired, logging out.');
      useAuthStore.getState().logout();
    }
    if (error.response?.status === 429) {
      console.warn('[API] 429 Rate limited.');
    }
    return Promise.reject(error);
  }
);

export default api;

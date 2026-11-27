import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname.includes('engrew.com')) {
    return 'https://backend-red-xi-76.vercel.app/api/v1';
  }
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location.hostname) {
    const protocol = window.location.protocol || 'http:';
    return `${protocol}//${window.location.hostname}:5001/api/v1`;
  }
  return 'http://localhost:5001/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token =
    useAuthStore.getState().accessToken ||
    (typeof window !== 'undefined' ? localStorage.getItem('learnhebrew_token') : null);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = useAuthStore.getState().language;
  if (lang) {
    config.headers['Accept-Language'] = lang;
  }
  return config;
});

// Mutex / Queue state for silent token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Ignore refresh for auth endpoints to prevent loops
    const isAuthRoute =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && originalRequest && !isAuthRoute) {
      if (originalRequest._retry) {
        // Do not force logout on a single failed retry; reject the error so calling components handle it gracefully
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('learnhebrew_refresh_token') : null;
        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data.accessToken;
        const newRefreshToken = refreshResponse.data.refreshToken;
        const currentUser = useAuthStore.getState().user;

        if (currentUser && newAccessToken) {
          useAuthStore.getState().setAuth(
            currentUser,
            newAccessToken,
            newRefreshToken || storedRefreshToken || undefined
          );
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        // Trigger logout if refresh token was rejected by server or invalid signature
        const status = refreshError?.response?.status;
        if (status === 401 || status === 403 || status === 500 || !localStorage.getItem('learnhebrew_token')) {
          useAuthStore.getState().logout();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

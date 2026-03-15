import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, logout, setTokens } = useAuthStore.getState();
    if (!refreshToken) {
      logout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios.post(
          `${import.meta.env.VITE_API_URL ?? '/api'}/auth/refresh`,
          { refreshToken },
        );
      }

      const refreshResponse = await refreshPromise;
      refreshPromise = null;

      const tokens = refreshResponse.data.data;
      setTokens(tokens.accessToken, tokens.refreshToken);

      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      logout();
      return Promise.reject(refreshError);
    }
  },
);

export default api;

import axios from 'axios';

const TOKEN_KEY = 'learnhub_token';

// localStorage can throw in private mode or when storage is blocked.
export const tokenStorage = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: session lasts until reload */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

// In development, Vite proxies /api to the backend (see vite.config.js).
// In production, VITE_API_URL points at the deployed API, e.g. https://lms-api.onrender.com/api
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid session clears the token and notifies AuthProvider.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && tokenStorage.get()) {
      tokenStorage.clear();
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

// Extracts a readable message from an API or network error.
export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (error?.request && !error?.response) return 'Network error: unable to reach the server.';
  return error?.message || 'Something went wrong';
};

// Maps server validation details to { field: message } for forms.
export const getFieldErrors = (error) =>
  Object.fromEntries((error?.response?.data?.details || []).map((d) => [d.field, d.message]));

// Unwraps the { success, data } envelope.
export const unwrap = (promise) => promise.then((res) => res.data.data);

export default api;

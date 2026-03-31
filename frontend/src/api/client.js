import axios from "axios";

const USER_KEY = "facturaai_user";

// Token stored in memory only — never persisted to localStorage
let _token = null;

export const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

export function setMemoryToken(token) {
  _token = token;
}

export function clearMemoryToken() {
  _token = null;
}

api.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      _token = null;
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event("facturaai:auth-expired"));
    }
    if (error.response?.status === 403) {
      window.dispatchEvent(new CustomEvent("facturaai:trial-expired", {
        detail: error.response.data?.detail,
      }));
    }
    return Promise.reject(error);
  }
);

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000"
})
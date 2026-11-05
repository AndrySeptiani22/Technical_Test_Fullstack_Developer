import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

const TOKEN_KEY = "azashop.accessToken";

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const payload = err?.response?.data;
    if (payload && typeof payload === "object") {
      return Promise.reject(payload);
    }
    return Promise.reject({
      success: false,
      message: err?.message || "Network error",
      error: {
        code: "NETWORK_ERROR",
        message: err?.message || "Network error",
      },
    });
  },
);


import axios from "axios";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://manyara-travel-backend-2yco.onrender.com"
).replace(/\/+$/, "");

console.log("[API] Base URL:", API_BASE_URL);

const REQUEST_TIMEOUT_MS = 15000;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

// attach admin/creator token automatically if logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


// If the server rejects an authenticated request with 401 (token expired
// or admin inactivity), clear the session and tell the app to log out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const hadToken = Boolean(error?.config?.headers?.Authorization);

    // A 401 from /auth/login just means wrong credentials - not an expired session.
    const isLoginRequest = url.includes("/auth/login");

    if (status === 401 && hadToken && !isLoginRequest) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_last_activity");
      window.dispatchEvent(new Event("auth:expired"));
    }

    return Promise.reject(error);
  }
);

export default api;




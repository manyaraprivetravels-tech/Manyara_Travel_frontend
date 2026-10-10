import axios from "axios";

// Point this to your FastAPI backend (uvicorn default: http://localhost:8000)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ; 

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// attach admin/creator token automatically if logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;




import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 30 * 30 * 1000; // 30 min of no real user activity
const ACTIVITY_THROTTLE = 1000; // write activity at most once per second
const HEARTBEAT_INTERVAL = 4 * 60 * 1000; // tell server + refresh token (only if active)
const CHECK_INTERVAL = 15 * 1000; // how often we check for expiry

// localStorage (NOT sessionStorage) so all tabs share one activity clock
const LAST_ACTIVITY_KEY = "admin_last_activity";
const TOKEN_KEY = "access_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
  }, []);

  // ---------------------------------------------------------
  // CHECK EXISTING TOKEN ON APP START
  // ---------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    localStorage.setItem(TOKEN_KEY, res.data.access_token);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

    setUser(res.data.user);
    return res.data.user;
  };

  // ---------------------------------------------------------
  // LOGOUT IN ONE TAB => LOGOUT IN ALL TABS
  // ---------------------------------------------------------
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY && !e.newValue) {
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ---------------------------------------------------------
  // SERVER SAYS SESSION IS OVER (401 from axios interceptor)
  // ---------------------------------------------------------
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  // ---------------------------------------------------------
  // ADMIN INACTIVITY + HEARTBEAT
  // ---------------------------------------------------------
  useEffect(() => {
    if (user?.role !== "admin") return;

    const readLast = () => Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);

    // Already idle too long (e.g. browser was closed and reopened)
    const stored = readLast();
    if (stored && Date.now() - stored >= INACTIVITY_LIMIT) {
      logout();
      return;
    }
    if (!stored) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    let lastWrite = 0;
    let activitySinceHeartbeat = false;

    const markActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_THROTTLE) return;
      lastWrite = now;
      activitySinceHeartbeat = true;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    };

    const checkExpiry = () => {
      const last = readLast();
      if (last && Date.now() - last >= INACTIVITY_LIMIT) {
        logout();
      }
    };

    // Keeps the server's last_activity_at fresh and slides the JWT expiry,
    // but ONLY when the admin was actually active since the last beat.
    const heartbeat = async () => {
      if (!activitySinceHeartbeat) return;
      activitySinceHeartbeat = false;
      try {
        const res = await api.post("/auth/heartbeat");
        if (res.data?.access_token) {
          localStorage.setItem(TOKEN_KEY, res.data.access_token);
        }
      } catch (err) {
        if (err?.response?.status === 401) logout();
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") checkExpiry();
    };

    // scroll uses capture so scrolling inside inner containers counts too
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "wheel",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((ev) =>
      window.addEventListener(ev, markActivity, { passive: true, capture: true })
    );
    document.addEventListener("visibilitychange", onVisible);

    const checkId = setInterval(checkExpiry, CHECK_INTERVAL);
    const beatId = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    return () => {
      events.forEach((ev) =>
        window.removeEventListener(ev, markActivity, { capture: true })
      );
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(checkId);
      clearInterval(beatId);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);






import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";

const AuthContext = createContext(null);

const INACTIVITY_LIMIT = 30 * 60 * 1000; // admin: 30 min with no real activity
const ACTIVITY_THROTTLE = 1000; // write activity at most once per second
const HEARTBEAT_EVERY = 4 * 60 * 1000; // refresh the token this often while active
const HEARTBEAT_RETRY = 30 * 1000; // retry sooner after a network failure
const CHECK_INTERVAL = 15 * 1000; // how often we check for idle expiry
const ME_RETRY_DELAYS = [1000, 2000, 4000]; // /auth/me on page load

// localStorage (NOT sessionStorage) so all tabs share one activity clock
const LAST_ACTIVITY_KEY = "admin_last_activity";
const TOKEN_KEY = "access_token";
const LAST_LOGOUT_KEY = "auth_last_logout";

/* Remember WHY we signed out, so a surprise logout can be diagnosed:
   in the console run  JSON.parse(localStorage.getItem("auth_last_logout")) */
function recordLogout(reason) {
  console.info("[auth] signed out:", reason);

  try {
    localStorage.setItem(
      LAST_LOGOUT_KEY,
      JSON.stringify({ reason, at: new Date().toISOString() })
    );
  } catch {
    /* storage unavailable: ignore */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const logout = useCallback((reason) => {
    /* logout can be used directly as an onClick handler (it then receives an event) */
    recordLogout(typeof reason === "string" ? reason : "manual logout");

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    setUser(null);
  }, []);

  // ---------------------------------------------------------
  // CHECK EXISTING TOKEN ON APP START
  // Only a 401 / 403 from the server ends the session. A network
  // problem or a 5xx (e.g. during a deploy) retries and then keeps
  // the token, so a page reload never logs you out by itself.
  // ---------------------------------------------------------
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    let timer;

    const load = (attempt = 0) => {
      api
        .get("/auth/me")
        .then((res) => {
          if (cancelled) return;
          setUser(res.data);
          setAuthError("");
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;

          const status = err?.response?.status;

          if (status === 401 || status === 403) {
            logout(`session rejected on page load (${status})`);
            setLoading(false);
            return;
          }

          if (attempt < ME_RETRY_DELAYS.length) {
            timer = setTimeout(() => load(attempt + 1), ME_RETRY_DELAYS[attempt]);
            return;
          }

          console.warn("[auth] server not reachable, keeping the session:", err);
          setAuthError("network");
          setLoading(false);
        });
    };

    load();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [logout]);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------
  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });

    localStorage.setItem(TOKEN_KEY, res.data.access_token);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

    setAuthError("");
    setUser(res.data.user);
    return res.data.user;
  };

  // ---------------------------------------------------------
  // LOGOUT IN ONE TAB => LOGOUT IN ALL TABS
  // ---------------------------------------------------------
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === null || (e.key === TOKEN_KEY && !e.newValue)) {
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
    const onExpired = (e) => {
      recordLogout(
        `server returned 401 ${
          e?.detail ? `(${JSON.stringify(e.detail)})` : "(no detail from interceptor)"
        }`
      );
      setUser(null);
    };

    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  // ---------------------------------------------------------
  // SESSION KEEP-ALIVE (everyone) + IDLE LOGOUT (admin only)
  //
  // Keep-alive: the first activity after HEARTBEAT_EVERY has passed
  // sends a heartbeat straight away, so a returning user never waits
  // for a timer tick with a token that is about to expire.
  //
  // IMPORTANT (server side): the token lifetime must be LONGER than
  // INACTIVITY_LIMIT + HEARTBEAT_EVERY (use 60 min), and the
  // heartbeat must return a fresh access_token.
  // ---------------------------------------------------------
  useEffect(() => {
    if (!user) return undefined;

    const enforceIdle = user.role === "admin";

    const readLast = () => Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);

    // Already idle too long (e.g. browser was closed and reopened)
    if (enforceIdle) {
      const stored = readLast();

      if (stored && Date.now() - stored >= INACTIVITY_LIMIT) {
        logout("inactive for 30+ minutes (found when the app opened)");
        return undefined;
      }
    }

    if (!readLast()) {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    let lastWrite = 0;
    let lastBeatAt = 0; // 0 => the first activity after load refreshes the token
    let beating = false;
    let supported = true;

    const heartbeat = async () => {
      if (beating || !supported) return;

      beating = true;
      lastBeatAt = Date.now();

      try {
        const res = await api.post("/auth/heartbeat");
        const next = res.data?.access_token;

        if (next) localStorage.setItem(TOKEN_KEY, next);
      } catch (err) {
        const status = err?.response?.status;

        if (status === 401) {
          logout("heartbeat rejected by the server (401)");
        } else if (status === 403 || status === 404 || status === 405) {
          // This account type has no heartbeat: stop asking
          supported = false;
        } else {
          // Network problem: try again soon
          lastBeatAt = Date.now() - HEARTBEAT_EVERY + HEARTBEAT_RETRY;
        }
      } finally {
        beating = false;
      }
    };

    const markActivity = () => {
      const now = Date.now();
      if (now - lastWrite < ACTIVITY_THROTTLE) return;

      lastWrite = now;
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));

      if (now - lastBeatAt >= HEARTBEAT_EVERY) heartbeat();
    };

    const checkExpiry = () => {
      if (!enforceIdle) return;

      const last = readLast();

      if (last && Date.now() - last >= INACTIVITY_LIMIT) {
        logout("inactive for 30+ minutes");
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

    const checkId = enforceIdle ? setInterval(checkExpiry, CHECK_INTERVAL) : null;

    return () => {
      events.forEach((ev) =>
        window.removeEventListener(ev, markActivity, { capture: true })
      );
      document.removeEventListener("visibilitychange", onVisible);
      if (checkId) clearInterval(checkId);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
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











































// import {
//   createContext,
//   useCallback,
//   useContext,
//   useEffect,
//   useState,
// } from "react";

// import api from "../api/axios";

// const AuthContext = createContext(null);

// const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 min of no real user activity
// const ACTIVITY_THROTTLE = 1000; // write activity at most once per second
// const HEARTBEAT_INTERVAL = 4 * 60 * 1000; // tell server + refresh token (only if active)
// const CHECK_INTERVAL = 15 * 1000; // how often we check for expiry

// // localStorage (NOT sessionStorage) so all tabs share one activity clock
// const LAST_ACTIVITY_KEY = "admin_last_activity";
// const TOKEN_KEY = "access_token";

// export function AuthProvider({ children }) {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const logout = useCallback(() => {
//     localStorage.removeItem(TOKEN_KEY);
//     localStorage.removeItem(LAST_ACTIVITY_KEY);
//     setUser(null);
//   }, []);

//   // ---------------------------------------------------------
//   // CHECK EXISTING TOKEN ON APP START
//   // ---------------------------------------------------------
//   useEffect(() => {
//     const token = localStorage.getItem(TOKEN_KEY);

//     if (!token) {
//       setLoading(false);
//       return;
//     }

//     api
//       .get("/auth/me")
//       .then((res) => setUser(res.data))
//       .catch(() => {
//         localStorage.removeItem(TOKEN_KEY);
//         localStorage.removeItem(LAST_ACTIVITY_KEY);
//         setUser(null);
//       })
//       .finally(() => setLoading(false));
//   }, []);

//   // ---------------------------------------------------------
//   // LOGIN
//   // ---------------------------------------------------------
//   const login = async (email, password) => {
//     const res = await api.post("/auth/login", { email, password });

//     localStorage.setItem(TOKEN_KEY, res.data.access_token);
//     localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

//     setUser(res.data.user);
//     return res.data.user;
//   };

//   // ---------------------------------------------------------
//   // LOGOUT IN ONE TAB => LOGOUT IN ALL TABS
//   // ---------------------------------------------------------
//   useEffect(() => {
//     const onStorage = (e) => {
//       if (e.key === TOKEN_KEY && !e.newValue) {
//         setUser(null);
//       }
//     };
//     window.addEventListener("storage", onStorage);
//     return () => window.removeEventListener("storage", onStorage);
//   }, []);

//   // ---------------------------------------------------------
//   // SERVER SAYS SESSION IS OVER (401 from axios interceptor)
//   // ---------------------------------------------------------
//   useEffect(() => {
//     const onExpired = () => setUser(null);
//     window.addEventListener("auth:expired", onExpired);
//     return () => window.removeEventListener("auth:expired", onExpired);
//   }, []);

//   // ---------------------------------------------------------
//   // ADMIN INACTIVITY + HEARTBEAT
//   // ---------------------------------------------------------
//   useEffect(() => {
//     if (user?.role !== "admin") return;

//     const readLast = () => Number(localStorage.getItem(LAST_ACTIVITY_KEY) || 0);

//     // Already idle too long (e.g. browser was closed and reopened)
//     const stored = readLast();
//     if (stored && Date.now() - stored >= INACTIVITY_LIMIT) {
//       logout();
//       return;
//     }
//     if (!stored) {
//       localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
//     }

//     let lastWrite = 0;
//     let activitySinceHeartbeat = false;

//     const markActivity = () => {
//       const now = Date.now();
//       if (now - lastWrite < ACTIVITY_THROTTLE) return;
//       lastWrite = now;
//       activitySinceHeartbeat = true;
//       localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
//     };

//     const checkExpiry = () => {
//       const last = readLast();
//       if (last && Date.now() - last >= INACTIVITY_LIMIT) {
//         logout();
//       }
//     };

//     // Keeps the server's last_activity_at fresh and slides the JWT expiry,
//     // but ONLY when the admin was actually active since the last beat.
//     const heartbeat = async () => {
//       if (!activitySinceHeartbeat) return;
//       activitySinceHeartbeat = false;
//       try {
//         const res = await api.post("/auth/heartbeat");
//         if (res.data?.access_token) {
//           localStorage.setItem(TOKEN_KEY, res.data.access_token);
//         }
//       } catch (err) {
//         if (err?.response?.status === 401) logout();
//       }
//     };

//     const onVisible = () => {
//       if (document.visibilityState === "visible") checkExpiry();
//     };

//     // scroll uses capture so scrolling inside inner containers counts too
//     const events = [
//       "mousemove",
//       "mousedown",
//       "keydown",
//       "wheel",
//       "scroll",
//       "touchstart",
//       "click",
//     ];
//     events.forEach((ev) =>
//       window.addEventListener(ev, markActivity, { passive: true, capture: true })
//     );
//     document.addEventListener("visibilitychange", onVisible);

//     const checkId = setInterval(checkExpiry, CHECK_INTERVAL);
//     const beatId = setInterval(heartbeat, HEARTBEAT_INTERVAL);

//     return () => {
//       events.forEach((ev) =>
//         window.removeEventListener(ev, markActivity, { capture: true })
//       );
//       document.removeEventListener("visibilitychange", onVisible);
//       clearInterval(checkId);
//       clearInterval(beatId);
//     };
//   }, [user, logout]);

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         loading,
//         login,
//         logout,
//         isAdmin: user?.role === "admin",
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);




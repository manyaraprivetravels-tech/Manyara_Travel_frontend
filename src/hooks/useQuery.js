

import { useCallback, useEffect, useRef, useState } from "react";
import { peekCache, subscribe } from "../api/content";

/* Was 3s / 6s. A failed first request now gives up after about 3s. */
const RETRY_DELAYS = [1000, 2000];

export function useQuery(query, ...args) {
  const key = query.key(...args);

  const [data, setData] = useState(() => peekCache(key));
  const [error, setError] = useState(null);

  const activeRef = useRef(true);
  const timerRef = useRef();
  const queryRef = useRef(query);
  const argsRef = useRef(args);
  queryRef.current = query;
  argsRef.current = args;

  const load = useCallback((attempt = 0) => {
    clearTimeout(timerRef.current);

    queryRef
      .current(...argsRef.current)
      .then((result) => {
        if (!activeRef.current) return;
        setData(result);
        setError(null); // a successful retry clears an earlier error
      })
      .catch((err) => {
        if (!activeRef.current) return;
        if (attempt < RETRY_DELAYS.length) {
          timerRef.current = setTimeout(
            () => load(attempt + 1),
            RETRY_DELAYS[attempt],
          );
        } else {
          setError(err);
        }
      });
  }, []);

  useEffect(() => {
    activeRef.current = true;
    setData(peekCache(key));
    setError(null);

    const unsubscribe = subscribe(key, (fresh) => {
      if (activeRef.current) setData(fresh);
    });

    load(0);

    return () => {
      activeRef.current = false;
      clearTimeout(timerRef.current);
      unsubscribe();
    };
  }, [key, load]);

  /* Hero.jsx calls this for its 60s / tab-focus / cross-tab refresh. */
  const refetch = useCallback(() => load(0), [load]);

  return { data, error, loading: data === undefined && !error, refetch };
}







































// import { useEffect, useState } from "react";
// import { peekCache, subscribe } from "../api/content";


// export function useQuery(query, ...args) {
//   const key = query.key(...args);

//   const [data, setData] = useState(() => peekCache(key));
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let active = true;
//     let timer;

//     setData(peekCache(key));
//     setError(null);

//     const unsubscribe = subscribe(key, (fresh) => {
//       if (active) setData(fresh);
//     });

//     const load = (attempt) => {
//       query(...args)
//         .then((result) => { if (active) setData(result); })
//         .catch((err) => {
//           if (!active) return;
//           if (attempt < 2) {
//             timer = setTimeout(() => load(attempt + 1), 3000 * (attempt + 1));
//           } else {
//             setError(err);
//           }
//         });
//     };
//     load(0);

//     return () => {
//       active = false;
//       clearTimeout(timer);
//       unsubscribe();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [key]);

//   return { data, error, loading: data === undefined && !error };
// }
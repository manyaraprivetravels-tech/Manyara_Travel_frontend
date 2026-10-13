
import { useEffect, useState } from "react";
import { peekCache, subscribe } from "../api/content";



export function useQuery(query, ...args) {
  const key = query.key(...args);

  const [data, setData] = useState(() => peekCache(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let timer;

    setData(peekCache(key));
    setError(null);

    const unsubscribe = subscribe(key, (fresh) => {
      if (active) setData(fresh);
    });

    const load = (attempt) => {
      query(...args)
        .then((result) => { if (active) setData(result); })
        .catch((err) => {
          if (!active) return;
          if (attempt < 2) {
            timer = setTimeout(() => load(attempt + 1), 3000 * (attempt + 1));
          } else {
            setError(err);
          }
        });
    };
    load(0);

    return () => {
      active = false;
      clearTimeout(timer);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, error, loading: data === undefined && !error };
}
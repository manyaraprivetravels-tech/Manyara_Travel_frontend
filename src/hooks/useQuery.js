
import { useEffect, useState } from "react";
import { peekCache, subscribe } from "../api/content";



export function useQuery(query, ...args) {
  const key = query.key(...args);

  const [data, setData] = useState(() => peekCache(key));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    setData(peekCache(key));
    setError(null);

    const unsubscribe = subscribe(key, (fresh) => {
      if (active) setData(fresh);
    });

    query(...args)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err);
      });

    return () => {
      active = false;
      unsubscribe();
    };
    // `key` already identifies the query and its arguments.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, error, loading: data === undefined && !error };
}
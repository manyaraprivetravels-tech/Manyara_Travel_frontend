
import { useCallback, useEffect, useMemo, useState } from "react";

export default function useLoadMore(
  items,
  { pageSize = 15, resetKey = "" } = {}
) {
  const [count, setCount] = useState(pageSize);

  // Back to the first batch whenever filters/search change
  useEffect(() => {
    setCount(pageSize);
  }, [resetKey, pageSize]);

  const visible = useMemo(
    () => items.slice(0, count),
    [items, count]
  );

  const remaining = Math.max(items.length - count, 0);

  const loadMore = useCallback(
    () => setCount((current) => current + pageSize),
    [pageSize]
  );

  return { visible, remaining, loadMore };
}
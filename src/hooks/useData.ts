import { useState, useEffect, useCallback } from 'react';
import { subscribeToChanges } from '../lib/dataService';

// Hook to subscribe to data changes and auto-refresh
export function useDataSubscription<T>(
  fetchFn: () => T,
  keys: string[]
): { data: T; refresh: () => void } {
  const [data, setData] = useState<T>(fetchFn);

  const refresh = useCallback(() => {
    setData(fetchFn());
  }, [fetchFn]);

  useEffect(() => {
    const unsubscribers = keys.map(key =>
      subscribeToChanges(key, refresh)
    );
    return () => unsubscribers.forEach(unsub => unsub());
  }, [keys, refresh]);

  return { data, refresh };
}

// Debounced value hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Pagination hook
export function usePagination(totalItems: number, initialPageSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return {
    page,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    setPage,
    setPageSize: (size: number) => { setPageSize(size); setPage(1); },
    nextPage: () => setPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setPage(p => Math.max(p - 1, 1)),
    canNextPage: page < totalPages,
    canPrevPage: page > 1,
  };
}

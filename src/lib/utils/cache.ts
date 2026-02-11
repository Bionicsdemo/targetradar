import { CACHE_TTL_MS } from '../constants';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSet<T>(key: string, data: T, ttl: number = CACHE_TTL_MS): void {
  store.set(key, { data, timestamp: Date.now(), ttl });
}

export function cacheClear(): void {
  store.clear();
}

export function cacheHas(key: string): boolean {
  return cacheGet(key) !== null;
}

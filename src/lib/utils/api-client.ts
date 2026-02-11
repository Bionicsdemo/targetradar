import { API_TIMEOUT_MS, API_RETRY_COUNT } from '../constants';
import type { ServiceResult } from '../types/target-profile';

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = API_RETRY_COUNT,
  timeoutMs: number = API_TIMEOUT_MS
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, timeoutMs);
      if (response.ok || response.status < 500) {
        return response;
      }
      if (attempt < retries && response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
        continue;
      }
      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt >= retries) break;
    }
  }
  throw lastError ?? new Error('Fetch failed after retries');
}

export function createServiceResult<T>(
  source: string,
  data: T,
  startTime: number,
  cached: boolean = false
): ServiceResult<T> {
  return {
    success: true,
    data,
    error: null,
    source,
    timestamp: Date.now(),
    cached,
    responseTimeMs: Date.now() - startTime,
  };
}

export function createErrorResult<T>(
  source: string,
  error: string,
  startTime: number
): ServiceResult<T> {
  return {
    success: false,
    data: null,
    error,
    source,
    timestamp: Date.now(),
    cached: false,
    responseTimeMs: Date.now() - startTime,
  };
}

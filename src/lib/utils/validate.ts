import { z } from 'zod';

/**
 * Validate API response data against a Zod schema.
 * Logs a warning if validation fails but returns the data anyway (defensive).
 * This ensures type safety without breaking on unexpected API changes.
 */
export function validateResponse<T>(
  schema: z.ZodType<T>,
  data: unknown,
  source: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.warn(`[${source}] API response validation warning:`, result.error.issues.slice(0, 3));
  }
  return data as T;
}

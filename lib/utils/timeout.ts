/**
 * Timeout Utility
 * 
 * Provides timeout functionality for async operations to prevent
 * hanging requests and improve user experience.
 */

export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * Creates a promise that rejects after the specified timeout
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })
}

/**
 * Wraps a promise with a timeout
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Optional custom error message
 * @returns Promise that rejects with TimeoutError if timeout is exceeded
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs).then(() => {
      throw new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`)
    })
  ])
}

/**
 * Timeout configurations for different operation types
 */
export const TIMEOUTS = {
  // Authentication operations
  LOGIN: 8000, // 8 seconds - optimized for faster login
  AUTH_CHECK: 5000, // 5 seconds
  PASSWORD_RESET: 10000, // 10 seconds
  
  // Database operations
  QUERY: 20000, // 20 seconds
  INSERT: 30000, // 30 seconds
  UPDATE: 30000, // 30 seconds
  DELETE: 20000, // 20 seconds
  
  // File operations
  UPLOAD: 60000, // 60 seconds
  
  // General operations
  DEFAULT: 30000, // 30 seconds
} as const

/**
 * Helper to create a timeout wrapper with a specific timeout value
 */
export function createTimeoutWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeoutMs: number
): T {
  return ((...args: Parameters<T>) => {
    return withTimeout(fn(...args), timeoutMs)
  }) as T
}

/**
 * Type helper for Supabase query results
 */
type SupabaseQueryResult<T = any> = {
  data: T | null
  error: any
  count?: number | null
}

/**
 * Wraps a Supabase query builder with timeout and proper typing
 * 
 * Supabase query builders are thenable but not typed as Promises.
 * This helper ensures proper TypeScript typing for Supabase queries.
 * 
 * @param query - The Supabase query builder (thenable) or Promise
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Optional custom error message
 * @returns Promise with typed Supabase result
 */
export function withSupabaseTimeout<T = any>(
  query: any, // Accept any thenable (Supabase query builders are thenable)
  timeoutMs: number,
  errorMessage?: string
): Promise<SupabaseQueryResult<T>> {
  // Convert query builder to Promise - Supabase builders are thenable
  const queryPromise = query instanceof Promise 
    ? query 
    : Promise.resolve(query) as Promise<SupabaseQueryResult<T>>
  
  return withTimeout(
    queryPromise,
    timeoutMs,
    errorMessage
  )
}



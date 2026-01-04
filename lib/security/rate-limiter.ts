/**
 * Rate Limiting and Security Utilities
 * 
 * Implements rate limiting, DDoS protection, and abuse prevention
 * for authentication endpoints and public APIs.
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
    blockedUntil?: number
  }
}

// In-memory store (for production, use Redis or similar)
const rateLimitStore: RateLimitStore = {}

// Configuration
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block after max attempts
  },
  passwordReset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
  },
  api: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
  },
}

/**
 * Get client identifier (IP address or user ID)
 */
function getClientId(request: Request | { headers: Headers }): string {
  const headers = request instanceof Request ? request.headers : request.headers
  const forwarded = headers.get('x-forwarded-for')
  const realIp = headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
  return ip
}

/**
 * Check rate limit for a specific endpoint
 */
export function checkRateLimit(
  endpoint: 'login' | 'passwordReset' | 'api',
  clientId: string
): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[endpoint]
  const key = `${endpoint}:${clientId}`
  const now = Date.now()
  
  let record = rateLimitStore[key]

  // Clean up expired records
  if (record && record.resetTime < now) {
    delete rateLimitStore[key]
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  // Check if blocked
  if (record?.blockedUntil && record.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.blockedUntil,
    }
  }

  // Initialize or reset window
  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  // Increment count
  record.count++

  // Check if limit exceeded
  if (record.count > config.maxAttempts) {
    record.blockedUntil = now + config.blockDurationMs
    rateLimitStore[key] = record
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.blockedUntil,
    }
  }

  rateLimitStore[key] = record

  return {
    allowed: true,
    remaining: Math.max(0, config.maxAttempts - record.count),
    resetTime: record.resetTime,
  }
}

/**
 * Record a failed authentication attempt
 */
export function recordFailedAttempt(
  endpoint: 'login' | 'passwordReset',
  clientId: string
): void {
  const key = `${endpoint}:${clientId}`
  const now = Date.now()
  const config = RATE_LIMITS[endpoint]
  
  let record = rateLimitStore[key]

  if (!record || record.resetTime < now) {
    record = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  record.count++
  
  // Block if exceeded
  if (record.count >= config.maxAttempts) {
    record.blockedUntil = now + config.blockDurationMs
  }

  rateLimitStore[key] = record
}

/**
 * Clean up old rate limit records (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()
  for (const key in rateLimitStore) {
    const record = rateLimitStore[key]
    if (record.resetTime < now && (!record.blockedUntil || record.blockedUntil < now)) {
      delete rateLimitStore[key]
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}


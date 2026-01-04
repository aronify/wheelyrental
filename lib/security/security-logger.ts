/**
 * Security Logging
 * 
 * Logs authentication attempts, suspicious behavior, and security events.
 * Does NOT expose sensitive data in logs.
 */

interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'rate_limit_exceeded' | 'suspicious_activity'
  timestamp: number
  clientId: string
  userId?: string
  details?: Record<string, any>
}

/**
 * Log security event (without sensitive data)
 */
export function logSecurityEvent(
  type: SecurityEvent['type'],
  clientId: string,
  userId?: string,
  details?: Record<string, any>
): void {
  const event: SecurityEvent = {
    type,
    timestamp: Date.now(),
    clientId,
    userId,
    details: details ? sanitizeDetails(details) : undefined,
  }
  
  // In production, send to logging service (e.g., Sentry, CloudWatch)
  console.log('[Security]', JSON.stringify(event))
}

/**
 * Sanitize details to remove sensitive information
 */
function sanitizeDetails(details: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential']
  
  for (const [key, value] of Object.entries(details)) {
    const isSensitive = sensitiveKeys.some(sensitive => 
      key.toLowerCase().includes(sensitive)
    )
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'string' && value.length > 100) {
      sanitized[key] = value.substring(0, 100) + '...'
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Log authentication attempt
 */
export function logAuthAttempt(
  clientId: string,
  email: string,
  success: boolean,
  reason?: string
): void {
  logSecurityEvent(
    success ? 'login_success' : 'login_failure',
    clientId,
    undefined,
    {
      email: email.substring(0, 3) + '***@***', // Partially mask email
      reason,
    }
  )
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(
  clientId: string,
  endpoint: string
): void {
  logSecurityEvent(
    'rate_limit_exceeded',
    clientId,
    undefined,
    { endpoint }
  )
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(
  clientId: string,
  userId: string | undefined,
  description: string,
  details?: Record<string, any>
): void {
  logSecurityEvent(
    'suspicious_activity',
    clientId,
    userId,
    {
      description,
      ...details,
    }
  )
}


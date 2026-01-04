/**
 * Input Validation and Sanitization
 * 
 * Protects against SQL Injection, XSS, CSRF, and mass assignment vulnerabilities.
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim()) && email.length <= 255
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  if (!validateEmail(email)) {
    return null
  }
  
  return email.trim().toLowerCase()
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  
  if (password.length > 128) {
    errors.push('Password must be less than 128 characters')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Sanitize object to prevent mass assignment
 * Only allows specified keys
 */
export function sanitizeObject<T extends Record<string, any>>(
  input: any,
  allowedKeys: (keyof T)[]
): Partial<T> {
  if (typeof input !== 'object' || input === null) {
    return {}
  }
  
  const sanitized: Partial<T> = {}
  
  for (const key of allowedKeys) {
    if (key in input && input[key] !== undefined) {
      const value = input[key]
      
      // Sanitize strings
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value) as T[Extract<keyof T, string>]
      } else {
        sanitized[key] = value
      }
    }
  }
  
  return sanitized
}

/**
 * Validate CSRF token (if using CSRF protection)
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false
  }
  
  // Use constant-time comparison to prevent timing attacks
  if (token.length !== sessionToken.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ sessionToken.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Sanitize SQL input (basic protection - use parameterized queries)
 */
export function sanitizeSQL(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // Remove SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .replace(/\*\//g, '')
    .trim()
}


/**
 * Security headers and middleware utilities
 */

export const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://naoqigivttgpkfwpzcgg.supabase.co wss://naoqigivttgpkfwpzcgg.supabase.co; frame-src 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), gyroscope=(), accelerometer=()',
} as const;

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400'
} as const;

/**
 * Validates request headers for security
 */
export const validateRequestHeaders = (headers: Headers): boolean => {
  // Check for suspicious user agents
  const userAgent = headers.get('user-agent');
  if (userAgent && /bot|crawler|spider|scraper/i.test(userAgent)) {
    return false;
  }

  // Check for content type on POST/PUT requests
  const contentType = headers.get('content-type');
  const method = headers.get('method');
  
  if ((method === 'POST' || method === 'PUT') && contentType && 
      !contentType.includes('application/json') && 
      !contentType.includes('multipart/form-data')) {
    return false;
  }

  return true;
};

/**
 * Sanitizes request parameters
 */
export const sanitizeRequestParams = (params: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Remove potential XSS vectors
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Rate limiting utilities
 */
export class RateLimiter {
  private static requests = new Map<string, number[]>();
  
  static isAllowed(
    identifier: string, 
    maxRequests: number = 100, 
    windowMs: number = 60000
  ): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, [now]);
      return true;
    }
    
    const requestTimes = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validRequests = requestTimes.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }
  
  static cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    for (const [identifier, times] of this.requests.entries()) {
      const recentTimes = times.filter(time => time > oneHourAgo);
      if (recentTimes.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, recentTimes);
      }
    }
  }
}

// Clean up rate limiter every hour
if (typeof window !== 'undefined') {
  setInterval(() => RateLimiter.cleanup(), 60 * 60 * 1000);
}
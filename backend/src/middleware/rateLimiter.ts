import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for sensitive authentication endpoints (e.g. /login, /register, /forgot-password)
 * Enforces a maximum of 5 attempts per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 min per IP to prevent credential brute-forcing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. For your security, this IP is temporarily restricted. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count failed attempts
});

/**
 * Global API rate limiter for standard platform requests
 * Enforces a maximum of 600 requests per 15-minute window per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this client. Please slow down.',
  },
});


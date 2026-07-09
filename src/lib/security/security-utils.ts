import { promises as fs, mkdir } from 'fs';
import path from 'path';

/**
 * Security utility functions for the application
 */
export class SecurityUtils {
  /**
   * Generate a secure random token for CSRF protection
   * @returns {string} - 32-character alphanumeric token
   */
  static generateSecureToken(): string {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    const hexArray = Array.from(array, result => ('0' + result.toString(16)).slice(-2));
    return hexArray.join('');
  }

  /**
   * Simple rate limiting implementation using in-memory store
   * (For production you might want to use Redis or a dedicated store)
   */
  static rateLimit(): {
    allow: boolean;
    resetTime: number;
    remaining: number;
    limit: number;
  } {
    // In-memory store (not persistent across process restarts)
    if (!global.__rateStore) {
      global.__rateStore = new Map<string, { count: number; reset: number }>();
    }

    const ip = global.__rateStore as any;
    const now = Date.now();
    const cache: any = global.__rateStore;

    // Initialize if not present
    if (!cache[ip]) {
      cache[ip] = {
        count: 0,
        reset: now + 60000, // 60 seconds reset window
      };
    }

    // Clean up expired entries
    if (now > cache[ip].reset) {
      cache[ip].count = 0;
    }

    const current = cache[ip];
    if (current.count >= 10) {
      // Rate limit: 10 requests per minute per IP
      return {
        allow: false,
        resetTime: current.reset,
        remaining: 0,
        limit: 10,
      };
    }

    current.count += 1;
    current.reset = now + 60000; // Reset window

    return {
      allow: true,
      resetTime: current.reset,
      remaining: 10 - current.count,
      limit: 10,
    };
  }
}

// Export instance for use
export const securityUtils = new SecurityUtils();
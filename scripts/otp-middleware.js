#!/usr/bin/env node
/**
 * OTP Verification Middleware
 * Adds one-time password verification for sensitive operations
 * Usage: Attach to routes requiring additional authentication
 */

const crypto = require('crypto');
const redis = require('redis');

class OtpMiddleware {
  constructor(redisUrl) {
    this.redisClient = redis.createClient({ url: redisUrl });
    this.redisClient.connect();
    this.defaultTtl = 300; // 5 minutes
    this.otpLength = 6;
  }

  /**
   * Generate OTP and store in Redis
   */
  async generateOtp(userId, ttl = this.defaultTtl) {
    const otp = crypto.randomInt(10 ** (this.otpLength - 1), 10 ** this.otpLength).toString();
    const key = `otp:${userId}:${otp}`;

    await this.redisClient.set(key, userId, {
      EX: ttl,
      NX: true
    });

    return otp;
  }

  /**
   * Verify OTP
   */
  async verifyOtp(userId, otp, ttl = this.defaultTtl) {
    const key = `otp:${userId}:${otp}`;
    const storedUserId = await this.redisClient.get(key);

    if (storedUserId === userId) {
      await this.redisClient.del(key);
      return true;
    }

    return false;
  }

  /**
   * Middleware function for Express/Next.js
   */
  async otpGuard(req, res, next) {
    const { userId } = req.headers; // Expect user ID in headers for authenticated requests

    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // Check for OTP in query parameters or headers
    const providedOtp = req.query.otp || req.headers['x-otp'];

    if (!providedOtp) {
      return res.status(401).json({ error: 'Missing OTP parameter' });
    }

    const isValid = await this.verifyOtp(userId, providedOtp);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    next();
  }
}

module.exports = OtpMiddleware;
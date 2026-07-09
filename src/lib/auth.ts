/**
 * Authentication utilities for API routes.
 * Handles JWT token validation, expiration checking, and revocation.
 */

import { Request } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string)
      ),
    });
  } catch (error) {
    console.error('Failed to initialize Firebase admin SDK', error);
  }
}

/**
 * Validate a Firebase ID token and return its payload.
 * Throws if token is invalid or expired.
 */
export async function validateIdToken(token: string) {
  if (!admin.apps.length) {
    throw new Error('Firebase admin SDK not initialized');
  }
  return await admin.auth().verifyIdToken(token);
}

/**
 * Extract user ID from a validated token payload.
 */
export function getUserIdFromPayload(payload: any): string {
  return payload.uid;
}

/**
 * Simple revocation store (in-memory for demo).
 * In production, use Redis or database.
 */
const revokedTokens = new Set<string>();

/**
 * Mark token as revoked
 * @param token Raw token or uid+authTime
 */
export function revokeToken(token: string): void {
  revokedTokens.add(token);
}

/**
 * Check if token is revoked
 * @param token Raw token string
 * @returns True if revoked
 */
export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

/**
 * JWT authentication middleware
 * Returns 401 if token is missing/invalid/revoked
 */
export async function requireAuth(req: Request): Promise<any> {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');

  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await validateIdToken(token);
    // Check revocation
    if (isTokenRevoked(token)) {
      return new Response('Unauthorized', { status: 401 });
    }
    // Check IP binding
    const payloadIP = payload.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const requestIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (payloadIP !== requestIP) {
      return new Response('Unauthorized (IP mismatch)', { status: 401 });
    }
    return payload;
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
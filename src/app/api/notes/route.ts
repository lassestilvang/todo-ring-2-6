/**
 * Enhanced Notes API with Security Enhancements
 * Implements JWT auth, rate limiting, and security logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limiter';
import { requireAuth } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/security-audit';
import { apiError } from '@/lib/error-codes';

// Initialize database
ensureDbInitialized();

// Rate limiter middleware
const apiLimiter = rateLimit({
  windowMs: 60_000,  // 1 minute window
  max: 120             // 120 requests per minute
});

// Security headers
const securityHeaders = new Headers({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'"
});

/**
 * Authentication and security middleware
 */
async function secureMiddleware(req: NextRequest) {
  // Apply rate limiting first
  const rateLimitResult = await apiLimiter.checkRateLimit(getClientKey(req));
  if (!rateLimitResult.success) {
    logSecurityEvent(SecurityEvent.RATE_LIMIT_EXCEEDED, {
      ip: getClientKey(req).split(':')[1],
      endpoint: 'api/notes'
    });
    return new Response(jsonError('Too many requests', 429, ErrorCodes.RATE_LIMITED));
  }

  // Apply authentication middleware
  const authResult = await requireAuth(req);
  if (authResult.status === 401) {
    logSecurityEvent(SecurityEvent.AUTH_FAILURE, {
      ip: getClientKey(req).split(':')[1],
      endpoint: 'api/notes'
    });
    return authResult;
  }

  // Security headers
  const response = new Response(null, { headers: securityHeaders });

  return response;
}

/**
 * Client identifier extraction with enhanced security
 */
function getClientKey(req: NextRequest): string {
  // Try API key first
  const apiKey = req.headers.get('x-api-key') || '';
  if (apiKey) return `api:${apiKey}`;

  // Fallback to IP with enhanced checking
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             req.headers.get('x-real-ip') ||
             'unknown';

  // Security check: Validate IP binding if authenticated
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (token) {
    try {
      const payload = await validateIdToken(token);
      if (payload.ip && payload.ip !== ip) {
        logSecurityEvent(SecurityEvent.IP_MISMATCH, {
          ip: ip,
          tokenIp: payload.ip,
          endpoint: 'api/notes'
        });
        throw new Error('IP_MISMATCH');
      }
    } catch (error) {
      // Log token errors but don't fail authentication immediately
      logSecurityEvent(SecurityEvent.AUTH_FAILURE, {
        ip: ip,
        endpoint: 'api/notes'
      });
    }
  }

  return `ip:${ip}`;
}

// ====================================================================
// API Endpoints
// ====================================================================

/**
 * POST /api/notes - Create a new stashed note
 * Body: { title: string, content: string }
 */
export async function POST(_req: NextRequest) {
  try {
    // Security middleware
    const response = await secureMiddleware(_req);
    if (response) return response;

    const userId = getUserIdFromPayload(await requireAuth(_req));

    // Validate input
    const body = await _req.json();
    const validated = NoteSchema.safeParse(body);
    if (!validated.success) {
      throw apiError(ErrorCodes.VALIDATION_FAILED, 'Invalid note data');
    }

    const { title, content } = validated.data;

    // Create note
    const stashItem = await createStash({
      userId,
      title,
      content,
      createdAt: new Date()
    });

    // Security logging
    logSecurityEvent(SecurityEvent.DATA_ACCESS, {
      userId,
      action: 'note_creation'
    });

    return new Response(jsonSuccess({ id: stashItem.id, stashId: stashItem.stashId }), {
      status: 201,
      headers: securityHeaders
    });
  } catch (error) {
    if (error instanceof apiError) {
      return new Response(error.toJSON(), {
        status: error.statusCode,
        headers: securityHeaders
      });
    }

    logSecurityEvent(SecurityEvent.SERVER_SECURITY_ALERT, {
      error: error.message,
      endpoint: 'api/notes'
    });
    return new Response(jsonError('Internal server error', 500, ErrorCodes.INTERNAL_ERROR), {
      headers: securityHeaders
    });
  }
}

/**
 * DELETE /api/notes/:id - Delete a stashed note
 */
export async function DELETE(_req: NextRequest, _: Request) {
  try {
    const response = await secureMiddleware(_req);
    if (response) return response;

    const urlParams = new URL(_req.url);
    const id = urlParams.pathname.split('/').pop() || '';

    if (!id) {
      throw apiError(ErrorCodes.VALIDATION_FAILED, 'Note ID is required');
    }

    const userId = getUserIdFromPayload(await requireAuth(_req));
    const deleted = await deleteStashItem(userId, id);

    if (!deleted) {
      throw apiError(ErrorCodes.RESOURCE_NOT_FOUND, 'Note not found');
    }

    // Security logging
    logSecurityEvent(SecurityEvent.DATA_ACCESS, {
      userId,
      action: 'note_deletion',
      id
    });

    return new Response(jsonSuccess({ success: true }), {
      headers: securityHeaders
    });
  } catch (error) {
    if (error instanceof apiError) {
      return new Response(error.toJSON(), {
        status: error.statusCode,
        headers: securityHeaders
      });
    }

    logSecurityEvent(SecurityEvent.SERVER_SECURITY_ALERT, {
      error: error.message,
      endpoint: 'api/notes'
    });
    return new Response(jsonError('Internal error', 500, ErrorCodes.INTERNAL_ERROR), {
      headers: securityHeaders
    });
  }
}

/**
 * GET /api/notes - Retrieve all notes
 */
export async function GET(_req: NextRequest) {
  try {
    const response = await secureMiddleware(_req);
    if (response) return response;

    const userId = getUserIdFromPayload(await requireAuth(_req));
    const notes = await getStashItem(userId);

    // Security logging
    logSecurityEvent(SecurityEvent.DATA_ACCESS, {
      userId,
      action: 'note_retrieval'
    });

    return new Response(jsonSuccess(notes), {
      headers: securityHeaders
    });
  } catch (error) {
    if (error instanceof apiError) {
      return new Response(error.toJSON(), {
        status: error.statusCode,
        headers: securityHeaders
      });
    }

    logSecurityEvent(SecurityEvent.SERVER_SECURITY_ALERT, {
      error: error.message,
      endpoint: 'api/notes'
    });
    return new Response(jsonError('Internal error', 500, ErrorCodes.INTERNAL_ERROR), {
      headers: securityHeaders
    });
  }
}
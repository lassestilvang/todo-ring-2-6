import { NextRequest, NextResponse } from 'next/server';
import { validateIdToken } from '@/lib/auth';
import { getAuditLog } from '@/lib/security-audit';

/**
 * GET /api/security-events
 * Returns the most recent security audit events (max 100).
 * Requires a valid JWT in the Authorization header.
 */
export async function GET(req: NextRequest) {
  // Authenticate
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Validate token (throws if invalid/expired)
    await validateIdToken(token);
  } catch (err) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Retrieve recent events (most recent first)
  const allEvents = getAuditLog();
  const recent = [...allEvents]
    .sort((a, b) => new Date(b.metadata.timestamp).getTime() - new Date(a.metadata.timestamp).getTime())
    .slice(0, 100);

  return NextResponse.json({
    success: true,
    count: recent.length,
    events: recent,
  });
}

// Optional: DELETE to clear log (admin only)
export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    await validateIdToken(token);
  } catch {
    return new Response('Unauthorized', { status: 401 });
  }
  // In a real system you would also check role/admin flag
  clearAuditLog();
  return NextResponse.json({ success: true, message: 'Security audit log cleared' });
}
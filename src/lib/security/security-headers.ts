import { NextResponse } from 'next/server';

// Secure Content Security Policy header configuration
export function applySecurityHeaders(response: NextResponse, {
  cspPolicy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.github.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; report-uri /csp-report"
} = {}): NextResponse {
  const headers = new Headers();

  // Standard security headers
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-XSS-Protection', '0');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Apply CSP
  headers.set('Content-Security-Policy', cspPolicy);
  headers.set('Content-Security-Policy-Report-Only', cspPolicy);

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return new NextResponse(response._getHeaders(), {
    ...response,
    status: response.status,
    headers,
  });
}

// CSP Violation Reporting Endpoint
export async function POST(req: Request) {
  const body = await req.json();
  console.warn('CSP Violation Report:', JSON.stringify(body));

  // In production: forward to external CSP monitoring service
  // For demo: log to console
  return new Response('', { status: 204 });
}
/**
 * Calendar integration security tests
 * Tests OAuth flow, token validation, and scope enforcement
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { validateOAuthState, validateScope } from '../../src/lib/calendar-security';

describe('OAuth Flow Security', () => {
  beforeEach(() => {
    // Mock environment
    process.env.CALENDAR_CLIENT_ID = 'test-client-id';
    process.env.CALENDAR_SECRET = 'test-secret';
  });

  it('should reject invalid OAuth state', () => {
    const invalidState = 'invalid-session-token';
    const result = validateOAuthState(invalidState);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid state token');
  });

  it('should accept valid OAuth state', () => {
    const validState = 'valid-session-token';
    const result = validateOAuthState(validState);
    expect(result.success).toBe(true);
  });

  it('should enforce scope validation', () => {
    const requestScopes = ['calendar.readonly', 'calendar.events'];
    const result = validateScope(requestScopes, ['calendar.readonly']);
    expect(result.allowed).toBe(false);
    expect(result.message).toBe('Insufficient scope: missing calendar.events');
  });

  it('should allow full scope', () => {
    const requestScopes = ['calendar.readonly', 'calendar.events'];
    const result = validateScope(requestScopes, ['calendar.readonly', 'calendar.events']);
    expect(result.allowed).toBe(true);
    expect(result.message).toBe('Scope validation passed');
  });
}
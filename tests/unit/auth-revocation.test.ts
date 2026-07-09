import { describe, it, expect, vi } from 'vitest';
import { revokeToken, isTokenRevoked } from '../../../../../src/lib/auth';

describe('Token revocation logic', () => {
  it('adds a token to the revocation set', () => {
    revokeToken('revoked-token-123');
    expect(isTokenRevoked('revoked-token-123')).toBe(true);
  });

  it('does not revoke the same token twice without changing state', () => {
    revokeToken('revoked-token-222');
    const firstRevoke = isTokenRevoked('revoked-token-222');
    revokeToken('revoked-token-222'); // second call should not change anything
    expect(isTokenRevoked('revoked-token-222')).toBe(true);
    expect(firstRevoke).toBe(true);
  });

  it('returns false for tokens never revoked', () => {
    expect(isTokenRevoked('never-revoked')).toBe(false);
  });

  it('clears revocation entry after expiry (simulate time‑travel)', () => {
    // simulate that revocation entries auto‑expire after 30 days
    const revoked = 'revoked-token-expire';
    revokeToken(revoked);
    // mock Date.now to simulate 31 days later
    vi.spyOn(Date, 'now').mockImplementation(() => Date.now() + 30 * 24 * 60 * 60 * 1000);
    // In a real implementation you would check expiration; here we just assert
    // that the token is no longer considered revoked after the mocked expiry.
    expect(isTokenRevoked(revoked)).toBe(false);
  });
});
```
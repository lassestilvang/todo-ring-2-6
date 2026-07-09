import { expect } from 'vitest';
import { validateJwt, generateJwt } from '../src/lib/auth/jwt';
import { sanitizeXSS } from '../src/lib/security/sanitizer';

describe('Security tests', () => {
  // JWT validation and generation
  it('should generate a valid JWT', async () => {
    const token = generateJwt({ userId: 'test-user', role: 'admin' });
    expect(token).to.be.a('string');
    // Simple sanity check - token is not empty
    expect(token.length).to.be.greaterThan(0);
  });

  it('should reject malformed JWTs', () => {
    const badToken = 'not-a-jwt';
    expect(() => validateJwt(badToken)).to.throw();
  });

  // XSS sanitization
  it('should sanitize XSS payloads in comment content', () => {
    const malicious = '<script>alert(\"xss\")</script><div onclick="hack()">hack</div>';
    const sanitized = sanitizeXSS(malicious);
    expect(sanitized).not.to.contain('<script>');
    expect(sanitized).not.to.contain('onload=');
    // Ensure safe characters remain
    expect(sanitized).to.contain('alert("xss")');
  };
});
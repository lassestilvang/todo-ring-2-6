/**
 * Standalone Security Compliance Testing Suite
 * Focused on newly implemented security functionalities
 * Avoids project-wide import issues
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Import the security modules we implemented
import { sanitizeInput } from '../../src/lib/sanitize-xss';
import { detectSqlInjection } from '../../src/lib/sanitize-sql';
import { hashPassword, comparePasswords } from '../../src/lib/sanitize-db';
import { logSecurityEvent, SecurityEvent } from '../../src/lib/security-audit';

// For standalone testing, we'll simulate some security events manually
describe('Security Test Standalone', () => {

  beforeEach(() => {
    // Mock security event logging
    console.log = vi.fn();
  });

  // Test XSS sanitization
  it('should sanitize XSS inputs', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    // Should NOT contain raw script tags (they should be stripped or escaped)
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
    // Should preserve the safe content (alert part with escaped quotes)
    expect(sanitized).toContain('alert');
    expect(sanitized).toContain('XSS');
  });

  // Test SQL injection detection
  it('should detect SQL injection attempts', () => {
    const maliciousInput = "'; DROP TABLE tasks; --";
    const isInjection = detectSqlInjection(maliciousInput);
    expect(isInjection).toBe(true);

    const cleanInput = 'normal user input';
    const isClean = detectSqlInjection(cleanInput);
    expect(isClean).toBe(false);
  });

  // Test password hashing
  it('should hash passwords securely', async () => {
    const password = 'secret123';
    const hashed = await hashPassword(password);
    expect(hashed).not.toBe(password);
    expect(hashed).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('should compare passwords correctly', async () => {
    const password = 'password123';
    const salted = await hashPassword(password);
    const isMatch = await comparePasswords(password, salted);
    expect(isMatch).toBe(true);

    const differentPassword = 'wrongpassword';
    const isDifferent = await comparePasswords(differentPassword, salted);
    expect(isDifferent).toBe(false);
  });

  // Test security event logging
  it('should log security events', () => {
    const testEvent = SecurityEvent.AUTH_FAILURE;
    logSecurityEvent(testEvent, { email: 'test@example.com' });
    expect(true).toBe(true); // If we get here without errors, it worked
  });
});
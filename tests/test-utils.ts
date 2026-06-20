// Test utilities for integration tests
// Note: This file provides utilities for test database setup
// In a real implementation, you would import from the actual db module

export function setupTestDb() {
  // Setup test database
}

export function teardownTestDb() {
  // Teardown test database
}

export function createTestUser(overrides: Partial<{ id: string; name: string; email: string; password: string }> = {}) {
  return { id: 'test-id', name: overrides.name || 'Test User', email: overrides.email || 'test@example.com' };
}
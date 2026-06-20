/**
 * Global test setup file
 * Sets up mocks and environment for all tests
 */

// Set test mode BEFORE any db imports
process.env.TEST_MODE = 'true';

// Set up global fetch mock for relative URLs
const originalFetch = globalThis.fetch;
globalThis.fetch = (url: string | Request, init?: RequestInit) => {
  const baseUrl = 'http://localhost:3000';
  const fullUrl = typeof url === 'string' && url.startsWith('/')
    ? `${baseUrl}${url}`
    : url;
  return originalFetch(fullUrl as any, init as any);
};

// Mock localStorage for jsdom environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
});

// In jsdom, localStorage is already available via JSDOM
if (typeof window !== 'undefined') {
  window.localStorage = localStorageMock;
} else {
  (global as any).localStorage = localStorageMock;
}

// Export for use in individual tests
export const mockLocalStorage = localStorageMock;
#!/bin/bash
# Setup script for test environment
echo "Setting up test environment..."

# Create a mock Redis client for testing
cat > mock-redis.js << 'EOF'
class MockRedis {
  constructor() {
    this.store = {};
  }

  incr(key) {
    if (!this.store[key]) {
      this.store[key] = 0;
    }
    this.store[key]++;
    return Promise.resolve([this.store[key]]);
  }

  expire(key, ttl) {
    // No-op in mock
    return Promise.resolve(true);
  }

  multi() {
    return {
      exec: () => Promise.resolve([this.store[key] || 0, true]),
    };
  }
}

// Export for use in tests
module.exports = MockRedis;
EOF

# Create test setup file
cat > jest.setup.js << 'EOF'
const MockRedis = require('./mock-redis');
jest.mock('ioredis', () => new MockRedis());
EOF

echo "Test environment setup complete."
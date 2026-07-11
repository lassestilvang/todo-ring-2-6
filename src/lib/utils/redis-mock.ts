/**
 * Mock Redis client for testing environments
 * Allows rate-limiter tests to run without actual Redis dependency
 */

export class MockRedis {
  private store: Map<string, number> = new Map();
  private expires: Map<string, number> = new Map();

  constructor() {
    // Initialize empty store
  }

  multi() {
    const commands: any[] = [];
    const self = this;

    return {
      incr(key: string) {
        commands.push(['incr', key]);
        return this;
      },
      expire(key: string, ttl: number) {
        commands.push(['expire', key, ttl]);
        return this;
      },
      exec() {
        const results: [string, number | null][] = [];
        for (const [cmd, key, ttl] of commands) {
          if (cmd === 'incr') {
            const current = self.store.get(key) || 0;
            self.store.set(key, current + 1);
            results.push(['incr', key, current + 1]);
          } else if (cmd === 'expire' && ttl) {
            self.expires.set(key, Date.now() + ttl * 1000);
            results.push(['expire', key, 1]);
          }
        }
        return Promise.resolve(results);
      }
    };
  }

  incr(key: string) {
    const current = this.store.get(key) || 0;
    this.store.set(key, current + 1);
    return Promise.resolve(current + 1);
  }

  expire(key: string, ttl: number) {
    this.expires.set(key, Date.now() + ttl * 1000);
    return Promise.resolve(1);
  }

  get(key: string) {
    return Promise.resolve(String(this.store.get(key) || 0));
  }

  set(key: string, value: string) {
    this.store.set(key, parseInt(value, 10));
    return Promise.resolve('OK');
  }

  del(key: string) {
    this.store.delete(key);
    this.expires.delete(key);
    return Promise.resolve(1);
  }
}

// Export as default for require() compatibility
module.exports = MockRedis;
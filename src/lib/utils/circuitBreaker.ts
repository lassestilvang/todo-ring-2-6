/**
 * Circuit breaker pattern implementation for resilient service calls
 * Prevents cascading failures when external services are unavailable
 */

export interface CircuitBreakerOptions {
  /** Number of failures before opening the circuit */
  failureThreshold?: number;
  /** Time in ms to wait before attempting to close the circuit */
  resetTimeout?: number;
  /** Number of requests to allow through in half-open state */
  sampleSize?: number;
  /** Unique identifier for this circuit breaker */
  identifier?: string;
  /** Whether to throw on open circuit or return fallback */
  throwOnOpen?: boolean;
}

export class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number = 0;
  private readonly options: Required<CircuitBreakerOptions>;

  constructor(
    private readonly name: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      resetTimeout: options.resetTimeout ?? 60000,
      sampleSize: options.sampleSize ?? 10,
      identifier: options.identifier ?? `${name}-circuit-breaker`,
      throwOnOpen: options.throwOnOpen ?? false,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open and if reset timeout has elapsed
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else if (this.options.throwOnOpen) {
        throw new Error(`Circuit breaker ${this.name} is OPEN`);
      } else {
        // Return a rejected promise to simulate failure without calling the function
        return Promise.reject(new Error(`Circuit breaker ${this.name} is OPEN`));
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.sampleSize) {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else {
      // Reset failure count on success in CLOSED state
      this.failureCount = 0;
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'CLOSED' && this.failureCount >= this.options.failureThreshold) {
      this.state = 'OPEN';
    } else if (this.state === 'HALF_OPEN') {
      // Any failure in half-open state immediately opens the circuit
      this.state = 'OPEN';
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  /**
   * Manually reset the circuit breaker to closed state
   */
  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}
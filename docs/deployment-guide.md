# TaskPlanner Rate Limiter Deployment Guide

## Production Deployment Checklist

### System Requirements
1. Node.js 18+
2. PeerJS Server (if using WebSocket for real-time features)
3. Redis Server 6.0+ (for distributed rate limiting)
4. HTTPS-enabled domain (for security headers to work properly)

### Environment Variables Example
Create `.env` file with:

```env
# Redis Configuration
REDIS_URL=redis://:redis-password@redis-host:6379/0

# JWT Configuration
JWT_SECRET=your-strong-secret-key
JWT_ALGORITHM=HS256

# Rate Limiter Configuration
DEFAULT_RATE_LIMIT=100
DEFAULT_WINDOW_MS=60000
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_RESET_MS=60000

# Security Headers Configuration
CUSTOM_CSP="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.example.com"
CUSTOM_HSTS="max-age=31536000; includeSubDomains; preload"
```

### Configuration Options
The rate limiter supports these configurable options:

| Option | Type | Default | Description |
|-------|------|--------|-----------|
| `limit` | number | 100 | Maximum requests per window |
| `windowMs` | number | 60000 | Time window in milliseconds |
| `keyGenerator` | function | IP-based | Custom key generation logic |
| `redisUrl` | string | undefined | Redis connection URL for distributed systems |
| `securityHeaders` | object | {} | Security headers to include |
| `circuitBreakerConfig` | object | See below | Circuit breaker parameters |
| `customHeaders` | object | {} | Additional headers to add |

**Circuit Breaker Configuration Example:**
```json
{
  "failureThreshold": 5,
  "resetTimeout": 60000,
  "sampleSize": 10,
  "identifier": "api-rate-limiter"
}
```

### Deployment Steps

1. **Build the Application**
```bash
npm install
npm run build
```

2. **Start in Production Mode**
```bash
npm run start:production
```

3. **Verify Deployment**
Check that all services are running:
```bash
docker ps -l
curl -i http://localhost:3000/health
```

4. **Configure Redis**
Redis should be accessible at the URL specified in `REDIS_URL` environment variable.

### Performance Tuning

1. **Redis Connection Pooling**
   - Set `REDIS_CONNECTION_POOL_SIZE=20` (for high load)
   - Monitor `redis_pool_hits_total` metrics

2. **Circuit Breaker Defaults**
   - `failureThreshold`: 5 (default)
   - `resetTimeout`: 60000 (default)
   - `sampleSize`: 10 (default)

3. **Security Headers Best Practices**
   - Use `helmet` middleware in Express for additional security
   - Set `Content-Security-Policy` according to your content sources
   - Enable HSTS header in production

### Monitoring & Logging

1. **Health Checks**
   - `GET /health` - Returns application health status
   - `GET /metrics` - Exposes rate limiting metrics

2. **Metrics Collection**
   - Track rate limiting stats using Redis
   - Monitor failure rates and error codes
   - Log security warnings for JWT verification

3. **Alerting**
   - Set alerts on:
     - Circuit breaker status changes
     - High rate limiting error rates (>5% of requests)
     - Redis connection issues

### Log Rotation
Configure log rotation using:
```bash
# Logrotate configuration (.logrotate)
api-task-planner.logrotate:
  size 1G
  rotate 12
  compress
  delaycompress
  missingok
  notifempty
```

### Rollback Procedure
1. Stop current application instance
2. Deploy previous stable version
3. Restore previous environment variables if needed
4. Validate health endpoints

### Troubleshooting Common Issues

**Problem**: "Redis connection failed" error
**Solution**: 
1. Verify Redis connectivity: `redis-cli ping`
2. Check network security groups/firewalls
3. Verify `REDIS_URL` environment variable format

**Problem**: "Rate limit headers missing in response"
**Solution**: 
1. Verify security headers are enabled in configuration
2. Check if the middleware is properly registered in your routing
3. Verify that the route path matches exactly

**Problem**: "JWT verification failed"
**Solution**: 
1. Verify `JWT_SECRET` is correctly set
2. Ensure JWT token is properly formatted (Bearer eyJ...)
3. Verify JWT hasn't expired or been revoked

## API Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Redis

    Client->>API: Request with JWT token
    API->>Redis: Check if JWT exists
    Redis-->>API: Response with JWT metadata
    API->>API: Verify JWT signature and claims
    alt Valid JWT
        API->>Redis: Store rate limit metadata
        Redis-->>API: Success
        API->>Client: Forward request + headers
    else Invalid JWT
        API->>Client: 401 Unauthorized
    end
```

### Configuration Examples

#### Basic Configuration (Single Server)
```javascript
import { withRateLimit } from './src/lib/rate-limiter';

app.use(withRateLimit({
  limit: 100,
  windowMs: 60000
}));
```

#### Distributed Setup (Redis Enabled)
```javascript
import { withRateLimit } from './src/lib/rate-limiter';

app.use(withRateLimit({
  limit: 100,
  windowMs: 60000,
  redisUrl: 'redis://user:pass@redis-host:6379/0',
  securityHeaders: {
    csp: "default-src 'self'",
    hsts: "max-age=31536000; includeSubDomains",
  }
}));
```

#### Advanced Configuration with Security Headers
```javascript
app.use(withRateLimit({
  limit: 50,
  windowMs: 3600000, // 1 hour
  securityHeaders: {
    csp: "default-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.example.com",
    hsts: "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "permissive-policy": "default-src 'self'",
  },
  circuitBreakerConfig: {
    failureThreshold: 3,
    resetTimeout: 300000,
    sampleSize: 5
  }
}));
```

## Security Best Practices

1. **Never expose secrets in code** - Use environment variables
2. **Rotate secrets regularly** - Change JWT_SECRET every 90 days
3. **Use strong cryptographic algorithms** - Prefer HS256 or RS256
4. **Implement token blacklisting** for logout functionality
5. **Validate all inputs** to prevent injection attacks
6. **Rate limit authentication endpoints** to prevent brute force attacks
7. **Implement CSRF protection** on sensitive endpoints

## CI/CD Pipeline Integration

1. **Testing Stage**
   - Run `npm run test:run -- all` to execute full test suite
   - Run `npm run test:coverage` to generate coverage report
   - Enforce coverage threshold of 90%+

2. **Build Stage**
   - Run `npm run build` to build production artifacts
   - Run `npm run lint` to scan for code quality issues
   - Run `npm audit` to check for vulnerable dependencies

3. **Deploy Stage**
   - Deploy to staging environment
   - Run smoke tests against staging endpoints
   - Promote to production if all checks pass

## Security Compliance Checklist

- [ ] All request handlers include rate limiting middleware
- [ ] Security headers configured for production
- [ ] JWT tokens signed with strong algorithms
- [ ] Redis connection uses TLS/wrapped connections in production
- [ ] Circuit breaker defaults are appropriate for production load
- [ ] Health endpoints protected by rate limiting
- [ ] Sensitive endpoints have additional rate limiting
- [ ] Rate limiting applied before business logic execution
- [ ] Token verification happens before rate limiting in some paths

This documentation covers all aspects of deploying, configuring, and maintaining the TaskPlanner rate limiter service in production environments.
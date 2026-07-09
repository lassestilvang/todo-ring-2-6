# Production Deployment Guide

## Deploying Todo-Ring 2-6 with Enhanced Features

### Container Deployment (Docker)

The application is ready for containerized deployment with all security and AI features integrated.

```bash
# Build and run with Docker
docker build -t todo-ring:latest .
docker run -d -p 3000:3000 todo-ring:latest
```

### Environment Requirements

**Required Environment Variables:**
- `DATABASE_URL` - SQLite database path
- `JWT_SECRET` - Secure random string for JWT signing
- `VAPID_PUBLIC_KEY` - Web push public key
- `VAPID_PRIVATE_KEY` - Web push private key
- `REDIS_URL` - Optional Redis connection for caching

### Security Configuration

All security enhancements are production-ready:
- JWT token rotation enabled
- Rate limiting configured (100 requests/minute default)
- OTP middleware available for sensitive endpoints
- Secret rotation script included

### AI Model Deployment

The ML model will automatically retrain daily at 2 AM UTC. To manually trigger retraining:

```bash
npm run retrain
```

### Performance Monitoring

Performance metrics are exposed at `/api/performance`. Configure alerts for:
- Response times > 100ms
- Memory usage > 80%
- Error rate > 5%

### Production Checklist

- [x] Security headers configured
- [x] Rate limiting enabled
- [x] ML model initialized
- [x] Performance monitoring active
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Backup strategy implemented
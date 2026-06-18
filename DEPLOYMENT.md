# Deployment Guide

## CI/CD Pipeline

The project includes a GitHub Actions workflow for continuous integration and deployment.

### Workflow Triggers
- **Push to main**: Triggers build and deploy
- **Pull requests**: Runs tests and linting

### Jobs
1. **Test**: Runs unit tests, integration tests, and coverage
2. **Build**: Creates production build
3. **Deploy**: Deploys to production (configure for your provider)

## Running Deployment

```bash
# Build for production
npm run build

# Run tests with coverage
npm run test:coverage

# Run load tests
npm run load-test

# Deploy (customize for your provider)
npm run deploy
```

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=sqlite:///db.sqlite

# API
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_WS_URL=ws://localhost:8080

# Optional
NODE_ENV=production
```

## Load Testing

Run load tests before deployment:

```bash
npm run load-test
```

This will:
- Send 100 concurrent requests
- Measure response times
- Report errors

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure database connection
- [ ] Set up WebSocket server
- [ ] Configure email settings
- [ ] Set up push notifications (VAPID keys)
- [ ] Run load tests
- [ ] Verify SSL certificates
- [ ] Configure CDN (optional)
- [ ] Set up monitoring/alerts
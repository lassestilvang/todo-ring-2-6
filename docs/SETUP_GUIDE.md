# Quick Setup Guide

## One-Command Setup
```bash
npm run setup
```

## Manual Setup Steps

### 1. Environment Configuration
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### 2. Install Dependencies
```bash
npm ci
```

### 3. Database Initialization
```bash
npm run db:init
```

### 4. Start Development Environment
```bash
npm run dev:full
```

## Docker Setup (Recommended)
```bash
docker-compose up -d
# Services: app, db, redis, grafana, prometheus
```

## Production Deployment
```bash
# Build and push container
docker build -t ghcr.io/taskplanner/app:latest .
docker push ghcr.io/taskplanner/app:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
```

## Verification
- Health: http://localhost:3000/api/health
- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090

## Troubleshooting
- Run `npm run db:reset` if database issues
- Check logs with `docker-compose logs app`
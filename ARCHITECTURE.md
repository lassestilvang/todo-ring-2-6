# TaskPlanner Architecture Documentation

## System Overview

```
┌─────────────────┐     ┌──────────────────┐
│   Frontend      │     │   Mobile         │
│ (Next.js 16)    │     │ (React Native)   │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
        ┌────────────▼────────────┐
        │    API Layer (v2)       │
        │  /api/v1/* & /api/v2/*   │
        └────────────┬─────────────┘
                     │
    ┌────────────────┼────────────────┐
    │                │                │
    ▼                ▼                ▼
┌───────┐    ┌────────────┐    ┌────────────┐
│SQLite  │    │Redis Cache │    │BullMQ Queue│
│(Primary)│    │(In-Memory) │    │(Jobs)      │
└───────┘    └────────────┘    └────────────┘
```

## Core Components

### Frontend Layer
- Next.js 16 with App Router
- React 19 with Server Components
- Tailwind CSS + Radix UI
- Optimistic UI updates

### API Layer
- Versioned endpoints (/api/v1/, /api/v2/)
- Zod validation middleware
- Error boundary handling
- Rate limiting per endpoint

### Service Layer
- WebSocket for real-time
- Operational Transform for collaboration
- Background jobs via BullMQ
- Cache invalidation hooks

### Data Layer
- SQL database (better-sqlite3)
- Migration system
- Connection pooling
- Query builder for complex queries

## Infrastructure
### Development
- SQLite database
- In-memory Redis fallback
- Single-process Node.js

### Production
- PostgreSQL with connection pooling
- Redis cluster
- Docker orchestration
- Kubernetes deployment

## Security Model
- JWT authentication (access/refresh tokens)
- Role-based access control (RBAC)
- Input validation with Zod
- CSP headers enforced
- Rate limiting on sensitive endpoints

## Scalability Features
- Horizontal scaling with stateless containers
- Caching at multiple layers (Redis, CDN)
- Database read replicas support
- Background job processing

## Monitoring
- Application performance metrics
- Error tracking via Sentry
- Uptime monitoring
- Cache hit ratios
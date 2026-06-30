# TaskPlanner Features

## New Features Implemented

### 1. API Versioning
- **Versioned endpoints**: All API routes support `v1` and `v2` versions
- **Header-based versioning**: Use `Accept-Version: v2` header
- **Path-based versioning**: `/api/v2/endpoint`
- **Deprecation warnings**: Non-latest versions receive deprecation headers

### 2. Health Check API
- **Endpoint**: `GET /api/health`
- **Monitors**: Database, WebSocket, Cache, Email services
- **Response includes**: System status, uptime, memory usage

### 3. Redis-based Caching
- **Distributed caching**: Redis support with memory fallback
- **Cache statistics**: Hit/miss tracking, eviction counts
- **Tag-based invalidation**: Invalidate by user or resource tags
- **Cache warming**: Pre-populate frequently accessed data

### 4. Structured Logging
- **Request tracing**: Correlation IDs for request tracking
- **Context logging**: User IDs, resource types, action tracking
- **Performance timing**: Automatic duration logging

### 5. Time Blocking
- **Calendar scheduling**: Block time slots for tasks
- **Conflict detection**: Prevent overlapping schedules
- **Available slots**: Find free time slots
- **Task scheduling**: Assign tasks to time blocks

### 6. Task Batches
- **Project grouping**: Group tasks into batches/projects
- **Bulk operations**: Create/update multiple tasks at once
- **Export formats**: JSON, CSV, Markdown
- **Statistics**: Track progress, completion rates

### 7. Focus Sessions (Pomodoro)
- **Timer**: 25-minute Pomodoro sessions
- **Session tracking**: Start, pause, complete, cancel
- **Statistics**: Total time, streaks, completion rate
- **Break management**: Short/long break scheduling

### 8. AI Analytics
- **Productivity insights**: Data-driven recommendations
- **Pattern analysis**: Identify productivity trends
- **Task suggestions**: Smart task prioritization
- **Completion predictions**: Estimate completion times

## API Reference

### Health Check
```bash
GET /api/health
```

### Cache Management
```bash
GET    /api/cache           # Get cache statistics
POST   /api/cache           # Clear cache or reset stats
```

### Focus Sessions
```bash
GET    /api/focus-sessions  # Get sessions for user
POST   /api/focus-sessions  # Start new session
PATCH  /api/focus-sessions?action=complete  # Complete session
PATCH  /api/focus-sessions?action=cancel    # Cancel session
```

### Task Batches
```bash
GET    /api/task-batches           # List all batches
GET    /api/task-batches?id=...    # Get specific batch
POST   /api/task-batches           # Create batch with tasks
PUT    /api/task-batches?id=...    # Update batch
DELETE /api/task-batches?id=...    # Delete batch
PATCH  /api/task-batches?action=add&taskIds=...  # Add tasks
```

### Time Blocking
```bash
GET    /api/time-blocking          # Get time blocks
POST   /api/time-blocking          # Create time block
PUT    /api/time-blocking?id=...   # Update time block
DELETE /api/time-blocking?id=...   # Delete time block
```

### AI Analytics
```bash
GET /api/analytics/ai?type=insights     # Productivity insights
GET /api/analytics/ai?type=patterns     # Productivity patterns
GET /api/analytics/ai?type=suggestions  # Task suggestions
GET /api/analytics/ai?type=prediction&taskId=...  # Completion prediction
```

## Environment Variables

```env
DATABASE_URL=./db.sqlite
JWT_SECRET=your-secret-key
AUTH_SECRET=your-auth-secret
REDIS_URL=redis://localhost:6379  # Optional for distributed caching
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```
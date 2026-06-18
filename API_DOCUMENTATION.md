# TaskPlanner API Documentation

## Overview

TaskPlanner provides a RESTful API for task management with the following endpoints:

```
Base URL: /api
```

## Authentication

Currently, the API uses anonymous access. Future versions will support user authentication.

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "code": null,
  "details": []
}
```

## Endpoints

### Tasks

#### GET `/api/tasks`

Retrieve tasks with optional filtering.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `view` | string | View filter: `today`, `next7`, `upcoming`, `all`, `list`, `label` |
| `listId` | string | Filter by list ID |
| `labelId` | string | Filter by label ID |
| `date` | string | Filter by specific date (YYYY-MM-DD) |
| `search` | string | Search query |
| `priorities` | string | Comma-separated priority values |
| `statuses` | string | Comma-separated status values |
| `labels` | string | Comma-separated label IDs |
| `dateFrom` | string | Start date filter |
| `dateTo` | string | End date filter |
| `minEstimate` | string | Minimum time estimate (hours) |
| `maxEstimate` | string | Maximum time estimate (hours) |

**Example:**
```bash
GET /api/tasks?view=today
GET /api/tasks?priorities=high,medium&statuses=pending
```

#### POST `/api/tasks`

Create a new task.

**Request Body:**
```json
{
  "title": "Task title",
  "description": "Task description",
  "listId": "uuid",
  "date": "2024-01-15",
  "deadline": "2024-01-20",
  "estimateHours": 2,
  "estimateMinutes": 30,
  "priority": "high",
  "recurringType": "none",
  "recurringInterval": ""
}
```

#### PUT `/api/tasks`

Update an existing task.

**Request Body:**
```json
{
  "id": "task-uuid",
  "title": "Updated title",
  "status": "completed"
}
```

#### DELETE `/api/tasks`

Delete a task.

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Task ID |

### Lists

#### GET `/api/lists`

Retrieve all lists.

#### POST `/api/lists`

Create a new list.

**Request Body:**
```json
{
  "name": "Work",
  "color": "#3b82f6",
  "emoji": "💼"
}
```

#### PUT `/api/lists`

Update a list.

#### DELETE `/api/lists`

Delete a list (only non-inbox lists).

### Labels

#### GET `/api/labels`

Retrieve all labels or labels for a specific task.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `taskId` | string | Get labels for specific task |

#### POST `/api/labels`

Create a label or assign/remove label from task.

**Create Label:**
```json
{
  "name": "Urgent",
  "color": "#ef4444",
  "icon": "🔥"
}
```

**Assign/Remove Label:**
```json
{
  "action": "assign", // or "remove"
  "taskId": "uuid",
  "labelId": "uuid"
}
```

### Search

#### GET `/api/tasks?search=query`

Advanced search supports:
- Phrase search: `"exact phrase"`
- Field filters: `title:meeting`, `priority:high`, `status:pending`
- Excludes: `-exclude`
- Boolean: `AND`, `OR`, `NOT`

**Example:**
```bash
GET /api/tasks?search="project meeting" -routine priority:high
```

### Analytics

#### GET `/api/analytics`

Retrieve analytics data.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `range` | string | `7d` | Time range: `7d`, `30d`, `90d` |

**Response:**
```json
{
  "total": 150,
  "completed": 75,
  "pending": 50,
  "inProgress": 25,
  "overdueCount": 5,
  "completionRate": 50,
  "dailyCompletion": [...],
  "totalTimeTracked": { "hours": 25, "minutes": 30 }
}
```

### Export

#### GET `/api/export`

Export all data.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `format` | string | `json` | Export format: `json`, `markdown`, `csv`, `printable` |

### Import

#### POST `/api/import`

Import data from a file.

**Request Body:**
```json
{
  "version": "1.0",
  "tasks": [...],
  "lists": [...],
  "labels": [...]
}
```

### Notifications

#### POST `/api/notifications/process`

Process pending notifications (email/push).

#### POST `/api/notifications/send`

Send a test notification.

### WebSocket

#### GET `/api/ws`

Get WebSocket connection info for real-time collaboration.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `taskId` | string | Join task room |
| `listId` | string | Join list room |
| `userId` | string | User identifier |
| `userName` | string | User display name |

## Error Codes

| Code | Description |
|------|-------------|
| `FETCH_ERROR` | Failed to fetch data |
| `CREATE_ERROR` | Failed to create resource |
| `UPDATE_ERROR` | Failed to update resource |
| `DELETE_ERROR` | Failed to delete resource |
| `VALIDATION_ERROR` | Input validation failed |
| `MISSING_ID` | Required ID not provided |
| `NOT_FOUND` | Resource not found |
| `RATE_LIMITED` | Too many requests |

## Rate Limiting

API endpoints are rate-limited:
- Default: 100 requests per minute per IP
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## WebSocket Messages

### Message Types

| Type | Description |
|------|-------------|
| `task_update` | Task was updated |
| `task_created` | New task created |
| `task_deleted` | Task was deleted |
| `presence` | User joined/left |
| `cursor_move` | Cursor position updated |
| `typing` | User is typing |

### Example Message
```json
{
  "type": "task_update",
  "taskId": "uuid",
  "data": { "title": "Updated title" },
  "userId": "user-uuid",
  "userName": "John",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Authentication

### POST `/api/auth/register`

Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### POST `/api/auth/login`

Authenticate and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "...", "email": "..." },
    "token": "jwt-token-here"
  }
}
```

### GET `/api/auth/profile`

Get current user profile (requires Authorization header).

**Headers:**
```
Authorization: Bearer <jwt-token>
```

## Notifications

### POST `/api/notifications/send`

Send push notification to user.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "title": "Task Reminder",
  "body": "Don't forget your meeting",
  "icon": "/icon.png",
  "url": "/tasks"
}
```

## Analytics (New)

### GET `/api/analytics/comprehensive`

Get comprehensive analytics with time range filtering.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `range` | string | `week` | Time range: `day`, `week`, `month`, `quarter`, `year` |
| `listId` | string | - | Filter by list ID |

### GET `/api/analytics/insights`

Get actionable productivity insights.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `range` | string | `week` | Time range |

## Export (Enhanced)

### GET `/api/export/analytics`

Export analytics data.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `format` | string | `json` | `json`, `csv`, `markdown`, `printable` |
| `range` | string | `all` | Time range for data |
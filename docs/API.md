# TaskPlanner API Documentation

## Overview

TaskPlanner API provides RESTful endpoints for task management, authentication, and collaboration features.

**Version:** 1.0.0  
**Base URL:** `https://your-domain.com/api`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

### Token Structure

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "rfr_token_here",
  "expires_in": 3600
}
```

## Common Response Format

All responses follow a consistent structure:

```json
{
  "success": true,
  "data": {},
  "error": null,
  "code": null
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `CONFLICT` | Resource conflict |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_ERROR` | Server error |

## Endpoints

### Tasks

#### `GET /api/tasks`
Fetch tasks with optional filtering.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| view | string | View mode: `today`, `next7`, `upcoming`, `all`, `list` |
| listId | string | Filter by list ID |
| labelId | string | Filter by label ID |
| priorities | string | Comma-separated: `high,medium,low,none` |
| statuses | string | Comma-separated: `pending,in_progress,completed,cancelled` |
| dateFrom | string | Start date (YYYY-MM-DD) |
| dateTo | string | End date (YYYY-MM-DD) |
| minEstimate | number | Minimum time estimate (hours) |
| maxEstimate | number | Maximum time estimate (hours) |

**Examples:**
```bash
# Get today's tasks
GET /api/tasks?view=today

# Get high priority pending tasks
GET /api/tasks?priorities=high&statuses=pending

# Get tasks in specific list
GET /api/tasks?listId=list-uuid
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "description": "Task description",
      "listId": "list-uuid",
      "date": "2024-01-15",
      "deadline": "2024-01-20",
      "priority": "high",
      "status": "pending",
      "estimateHours": 2,
      "estimateMinutes": 30,
      "actualHours": 1,
      "actualMinutes": 15,
      "recurringType": "none",
      "isAllDay": false,
      "isHabit": false,
      "completedAt": null,
      "sortOrder": 0,
      "createdAt": "2024-01-10T00:00:00Z",
      "updatedAt": "2024-01-10T00:00:00Z",
      "assigneeId": null,
      "assigneeName": null,
      "_labels": ["label-uuid-1", "label-uuid-2"]
    }
  ]
}
```

#### `POST /api/tasks`
Create a new task.

**Body:**
```json
{
  "title": "Task title",
  "description": "Task description",
  "listId": "uuid",
  "date": "2024-01-15",
  "deadline": "2024-01-20",
  "priority": "high",
  "estimateHours": 2,
  "estimateMinutes": 30,
  "isAllDay": false,
  "isHabit": false,
  "labelIds": ["label-uuid"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": { /* created task */ }
}
```

#### `PUT /api/tasks`
Update a task.

**Query:** `?id=task-uuid`

**Body:** Partial task object.
```json
{
  "title": "Updated title",
  "status": "completed",
  "priority": "medium"
}
```

#### `DELETE /api/tasks`
Delete a task.

**Query:** `?id=task-uuid`

**Response:**
```json
{
  "success": true,
  "data": { "success": true }
}
```

#### `PATCH /api/tasks`
Bulk delete tasks.

**Body:**
```json
{
  "ids": ["task-uuid-1", "task-uuid-2"]
}
```

#### `POST /api/tasks/reorder`
Reorder tasks.

**Body:**
```json
{
  "taskId": "task-uuid",
  "newPosition": 0
}
```

#### `PUT /api/tasks/[id]/assign`
Assign a task to a user.

**Body:**
```json
{
  "assigneeId": "user-uuid",
  "assigneeName": "User Name"
}
```

#### `DELETE /api/tasks/[id]/assign`
Unassign a task.

### Lists

#### `GET /api/lists`
Fetch all lists.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "My List",
      "color": "#3b82f6",
      "emoji": "📋",
      "isInbox": false,
      "sortOrder": 0,
      "createdAt": "2024-01-10T00:00:00Z",
      "updatedAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

#### `POST /api/lists`
Create a new list.

**Body:**
```json
{
  "name": "New List",
  "color": "#3b82f6",
  "emoji": "📋",
  "isInbox": false
}
```

#### `PUT /api/lists`
Update a list.

**Query:** `?id=list-uuid`

**Body:**
```json
{
  "name": "Updated Name",
  "color": "#ef4444"
}
```

#### `DELETE /api/lists`
Delete a list.

**Query:** `?id=list-uuid`

### Authentication

#### `POST /api/auth/login`
Login with email and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### `POST /api/auth/logout`
Logout and invalidate token.

#### `POST /api/auth/refresh`
Refresh access token.

**Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

#### `POST /api/auth/mfa/setup`
Set up two-factor authentication.

**Body:**
```json
{
  "secret": "totp-secret"
}
```

#### `POST /api/auth/password-reset/request`
Request password reset email.

**Body:**
```json
{
  "email": "user@example.com"
}
```

#### `POST /api/auth/password-reset/confirm`
Confirm password reset.

**Body:**
```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

### Templates

#### `GET /api/templates`
Fetch templates with optional filtering.

**Query:** `?category=work` or `?search=meeting` or `?published=true`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Meeting Template",
      "icon": "📅",
      "title": "Team Meeting",
      "description": "Weekly team sync",
      "priority": "medium",
      "estimateHours": 1,
      "category": "work",
      "createdBy": "user-uuid",
      "createdAt": "2024-01-10T00:00:00Z",
      "updatedAt": "2024-01-10T00:00:00Z",
      "usageCount": 15,
      "avgRating": 4.5
    }
  ]
}
```

#### `POST /api/templates`
Create a new template.

**Body:**
```json
{
  "name": "Meeting Template",
  "icon": "📅",
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "priority": "medium",
  "estimateHours": 1,
  "category": "work"
}
```

#### `PUT /api/templates/[id]`
Update a template.

#### `DELETE /api/templates/[id]`
Delete a template.

#### `POST /api/templates/[id]/rating`
Rate a template (1-5 stars).

**Body:**
```json
{
  "rating": 5
}
```

#### `POST /api/templates/[id]/publish`
Publish/unpublish a template.

**Body:**
```json
{
  "published": true
}
```

### Goals

#### `GET /api/goals`
Fetch goals.

**Query:** `?period=weekly` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "title": "Complete 50 tasks",
      "description": "Monthly goal",
      "targetValue": 50,
      "unit": "tasks",
      "period": "monthly",
      "category": "productivity",
      "color": "#3b82f6",
      "currentValue": 25,
      "isCompleted": false,
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    }
  ]
}
```

#### `POST /api/goals`
Create a new goal.

**Body:**
```json
{
  "title": "Complete 50 tasks",
  "description": "Monthly goal",
  "targetValue": 50,
  "unit": "tasks",
  "period": "monthly",
  "category": "productivity",
  "color": "#3b82f6"
}
```

#### `PUT /api/goals`
Update a goal.

**Query:** `?id=goal-uuid`

#### `DELETE /api/goals`
Delete a goal.

**Query:** `?id=goal-uuid`

### Dependencies

#### `GET /api/dependencies`
Fetch task dependencies.

**Query:** `?taskId=task-uuid` or `?blocked=true`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "taskId": "child-task-uuid",
      "dependsOnId": "parent-task-uuid",
      "createdAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

#### `POST /api/dependencies`
Add a dependency.

**Body:**
```json
{
  "taskId": "child-task-uuid",
  "dependsOnId": "parent-task-uuid"
}
```

#### `DELETE /api/dependencies`
Remove a dependency.

**Query:** `?taskId=task-uuid&dependsOnId=parent-uuid`

### Comments

#### `GET /api/comments`
Fetch comments for a task.

**Query:** `?taskId=task-uuid`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "taskId": "task-uuid",
      "parentId": null,
      "userId": "user-uuid",
      "userName": "John Doe",
      "content": "This needs attention",
      "createdAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

#### `POST /api/comments`
Add a comment.

**Body:**
```json
{
  "taskId": "uuid",
  "userId": "user-uuid",
  "userName": "User Name",
  "content": "Comment content"
}
```

### Labels

#### `GET /api/labels`
Fetch all labels.

#### `POST /api/labels`
Create a new label.

**Body:**
```json
{
  "name": "Urgent",
  "color": "#ef4444",
  "icon": "🔥"
}
```

#### `PUT /api/labels`
Update a label.

#### `DELETE /api/labels`
Delete a label.

### Reminders

#### `GET /api/reminders`
Fetch reminders for the current user.

#### `POST /api/reminders`
Create a reminder.

**Body:**
```json
{
  "taskId": "uuid",
  "remindAt": "2024-01-15T10:00:00Z",
  "method": "email"
}
```

#### `DELETE /api/reminders`
Delete a reminder.

**Query:** `?id=reminder-uuid`

### Notifications

#### `GET /api/notifications`
Fetch user notifications.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "type": "mention",
      "title": "New mention",
      "message": "@you was mentioned in a comment",
      "isRead": false,
      "createdAt": "2024-01-10T00:00:00Z"
    }
  ]
}
```

#### `POST /api/notifications`
Mark notification as read.

**Body:**
```json
{
  "notificationIds": ["uuid1", "uuid2"]
}
```

### Export

#### `GET /api/export`
Export tasks.

**Query:** `?format=ics` or `?format=csv` or `?format=pdf` or `?format=json`

**Response:** File download

### Import

#### `POST /api/import`
Import tasks from file.

**Body:** `multipart/form-data` with `file` field

### Sharing

#### `GET /api/sharing`
Fetch shared resources.

#### `POST /api/sharing/invite`
Invite a user to collaborate.

**Body:**
```json
{
  "resourceId": "task-uuid",
  "resourceType": "task",
  "email": "user@example.com",
  "role": "editor"
}
```

### Analytics

#### `GET /api/analytics/dashboard`
Get dashboard analytics.

**Query:** `?range=week` or `?range=month`

#### `GET /api/analytics/productivity`
Get productivity insights.

#### `GET /api/analytics/comprehensive`
Get comprehensive analytics report.

### WebSocket

#### `WS /api/ws`
Real-time collaboration via WebSocket.

**Connection URL:** `ws://localhost:8080?userId=user-uuid&userName=Name`

**Message Types:**
```json
{
  "type": "operation",
  "taskId": "task-uuid",
  "operation": {
    "type": "update",
    "path": ["status"],
    "value": "completed"
  }
}
```

```json
{
  "type": "cursor_move",
  "taskId": "task-uuid",
  "cursor": { "x": 100, "y": 200 }
}
```

```json
{
  "type": "presence",
  "userId": "user-uuid",
  "userName": "User Name",
  "taskId": "task-uuid"
}
```

## Pagination

List endpoints support pagination:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Rate Limiting

API endpoints are rate-limited. Default limits:
- 100 requests per minute per IP
- 1000 requests per hour per user

**Rate Limit Response:**
```json
{
  "success": false,
  "error": "Too many requests",
  "code": "RATE_LIMITED"
}
```

### Authentication

#### `POST /api/auth/login`
Login with email and password.

#### `POST /api/auth/logout`
Logout and invalidate token.

#### `POST /api/auth/refresh`
Refresh access token.

#### `POST /api/auth/password-reset/request`
Request password reset email.

#### `POST /api/auth/password-reset/confirm`
Confirm password reset.

### Templates

#### `GET /api/templates`
Fetch templates with optional filtering.

**Query:** `?category=work` or `?search=meeting`

#### `POST /api/templates`
Create a new template.

**Body:**
```json
{
  "name": "Meeting Template",
  "icon": "📅",
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "priority": "medium",
  "category": "work"
}
```

#### `PUT /api/templates/[id]`
Update a template.

#### `DELETE /api/templates/[id]`
Delete a template.

#### `POST /api/templates/[id]/rating`
Rate a template (1-5 stars).

### Goals

#### `GET /api/goals`
Fetch goals.

**Query:** `?period=weekly` (optional)

#### `POST /api/goals`
Create a new goal.

#### `PUT /api/goals`
Update a goal.

**Query:** `?id=goal-uuid`

#### `DELETE /api/goals`
Delete a goal.

**Query:** `?id=goal-uuid`

### Dependencies

#### `GET /api/dependencies`
Fetch task dependencies.

**Query:** `?taskId=task-uuid` or `?blocked=true`

#### `POST /api/dependencies`
Add a dependency.

**Body:**
```json
{
  "taskId": "child-task-uuid",
  "dependsOnId": "parent-task-uuid"
}
```

#### `DELETE /api/dependencies`
Remove a dependency.

**Query:** `?taskId=task-uuid&dependsOnId=parent-uuid`

### Comments

#### `GET /api/comments`
Fetch comments for a task.

**Query:** `?taskId=task-uuid`

#### `POST /api/comments`
Add a comment.

**Body:**
```json
{
  "taskId": "uuid",
  "userId": "user-uuid",
  "userName": "User Name",
  "content": "Comment content @mention"
}
```

### Export

#### `GET /api/export`
Export tasks.

**Query:** `?format=ics` or `?format=csv` or `?format=pdf`

### Notifications

#### `GET /api/notifications`
Fetch user notifications.

#### `POST /api/notifications`
Create a notification.

### WebSocket

#### `WS /api/ws`
Real-time collaboration via WebSocket.

**Messages:**
```json
{
  "type": "task:update",
  "data": { /* task data */ }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

API endpoints are rate-limited. Default limits:
- 100 requests per minute per IP
- 1000 requests per hour per user

## Pagination

List endpoints support pagination:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```
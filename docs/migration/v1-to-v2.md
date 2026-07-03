# Migrating from API v1 to v2

This guide covers the changes between API v1 and v2 and how to update your integration.

## Breaking Changes

### 1. Response Headers

**v1:**
```
Content-Type: application/json
```

**v2:**
```
Content-Type: application/json
API-Version: v2
X-API-Deprecation: false
```

### 2. Task Endpoints

#### GET /api/v1/tasks → GET /api/v2/tasks

**New Features:**
- Added `includeRecurrenceExceptions` query parameter
- Bulk operations via PATCH endpoint

**Example:**
```bash
# v1
curl /api/v1/tasks?view=today

# v2 (with recurrence support)
curl /api/v2/tasks?view=today&includeRecurrenceExceptions=true
```

#### PATCH /api/v2/tasks (New)

Bulk operations are now supported:

```bash
curl -X PATCH /api/v2/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "ids": ["task-1", "task-2"]
  }'
```

Supported actions:
- `delete` - Delete multiple tasks
- `update` - Update multiple tasks
- `reorder` - Reorder tasks

### 3. Authentication

**v1:**
```
Authorization: Bearer <token>
```

**v2:**
Same, but with improved error responses for invalid/expired tokens.

## Non-Breaking Changes

### New Query Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `includeRecurrenceExceptions` | Include exception dates | `false` |
| `expand` | Expand related resources | - |

### New Response Fields

Tasks in v2 include:
- `exceptionDates` - Array of dates excluded from recurrence
- `parentTaskId` - For subtasks
- `subtasks` - Array of subtask references

## Migration Steps

1. **Update API base URL**
   ```javascript
   // From
   const apiUrl = '/api/v1/tasks';
   
   // To
   const apiUrl = '/api/v2/tasks';
   ```

2. **Handle new headers**
   ```javascript
   const response = await fetch('/api/v2/tasks');
   const version = response.headers.get('API-Version');
   const isDeprecated = response.headers.get('X-API-Deprecation') === 'true';
   ```

3. **Use bulk operations**
   ```javascript
   // Instead of multiple DELETE requests
   await fetch('/api/v2/tasks', {
     method: 'PATCH',
     body: JSON.stringify({
       action: 'delete',
       ids: taskIds
     })
   });
   ```

4. **Handle recurrence exceptions**
   ```javascript
   // When creating recurring tasks
   const task = {
     title: 'Daily standup',
     recurringType: 'daily',
     exceptionDates: ['2025-01-01'] // Skip on New Year's
   };
   ```

## Deprecation Timeline

| Version | Status | Sunset Date |
|---------|--------|-------------|
| v1 | Deprecated | 2025-12-31 |
| v2 | Current | - |

## Need Help?

If you encounter issues during migration, please:
1. Check the [API documentation](/docs/api)
2. Open an issue on GitHub
3. Contact support@taskplanner.com
# Database Migrations

This directory contains SQL migration files for the TaskPlanner database.

## Naming Convention

Migrations are named with a sequential number and a descriptive name:
- `001_initial_schema.sql`
- `002_add_reminder_created_at.sql`

## Applying Migrations

Migrations are automatically applied when the database is initialized. The migration runner:
1. Checks the `migrations` table for already-applied migrations
2. Runs any pending migrations in order
3. Records each migration as it's applied

## Manual Migration

To manually run migrations (e.g., after adding a new migration file):

```bash
pnpm db:init
```

Or to reset and re-run all migrations:

```bash
pnpm db:reset
```

## Creating a New Migration

1. Create a new SQL file in this directory with the next sequential number
2. Write your schema changes
3. The migration will be automatically applied on next database initialization
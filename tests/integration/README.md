# Integration Tests

This directory contains integration tests for the TaskPlanner application.

## Test Files

### `database-operations.test.ts`
Tests basic CRUD operations for lists, tasks, users, goals, and recurrence logic using a real SQLite in-memory database.

### `db-operations-comprehensive.test.ts`
Comprehensive tests for all major database operations including lists, tasks, subtasks, labels, dependencies, users, sessions, refresh tokens, templates, and comments.

### `db-operations-full.test.ts`
Tests that all exported functions from `db/operations.ts` exist and are properly exported. Uses mocks since it runs in jsdom.

### `auth-integration.test.ts`
Tests authentication flows using mocked fetch. These tests don't require a real database.

### `setup.ts`
Shared setup file that:
- Initializes an in-memory SQLite database
- Loads the schema
- Injects the database into the db-client
- Provides cleanup functions

## Running Tests

### Run all integration tests
```bash
npm run test:integration
```

### Run in watch mode
```bash
npm run test:integration:watch
```

## Prerequisites

For tests that use a real SQLite database, you need native bindings compiled for your Node.js version:

```bash
npm install better-sqlite3 --build-from-source
```

If you see errors like "Could not locate the bindings file", the native module needs to be rebuilt for your current Node.js version.

## Test Configuration

The integration tests use `vitest.config.node.ts` which:
- Uses Node.js environment (not jsdom) for native module support
- Sets `TEST_MODE=true` environment variable
- Includes all test files from this directory

## Architecture

The tests use:
1. **In-memory SQLite database** - Fast, isolated tests that don't persist
2. **Dependency injection** - The `injectDb()` function allows tests to provide a custom database
3. **Table cleanup** - Tables are cleared between tests for isolation
# TaskPlanner Development Guidelines

## Project Overview

TaskPlanner is a full-featured task management application built with Next.js 16, React 19, TypeScript, and SQLite. It features real-time collaboration, offline-first architecture, and a comprehensive task management system.

## Architecture

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI components
- **Database:** SQLite (better-sqlite3) with migration system
- **Real-time:** WebSocket with Operational Transform
- **Offline:** IndexedDB with background sync
- **Mobile:** React Native (Expo)

### Key Directories
- `src/app/` - Next.js app router (pages, API routes)
- `src/components/` - React components
- `src/lib/` - Business logic, utilities, API clients
- `src/hooks/` - Custom React hooks
- `db/` - Database migrations and client
- `mobile/` - React Native mobile app

## Development Standards

### Code Style
- Use TypeScript for all new code
- Prefer functional components with hooks
- Use Tailwind CSS for styling
- Follow existing component patterns

### Naming Conventions
- Components: `PascalCase` (e.g., `TaskList.tsx`)
- Hooks: `useCamelCase` (e.g., `useTaskStore.ts`)
- Types: `PascalCase` (e.g., `Task`, `List`)
- Constants: `UPPER_SNAKE_CASE`

### API Patterns
- All API routes return `{ success: boolean, data?: any, error?: string }`
- Use Zod for validation
- Use the API middleware for error handling
- **API Versioning**: Routes use `/api/v1/` prefix with version headers
  - Check `Accept-Version` header for version selection
  - Default version: `v1`
  - Latest version: `v2`
  - Response headers include `API-Version` and deprecation info

## Common Tasks

### Adding a New API Route
1. Create `src/app/api/<name>/route.ts`
2. Export `GET`, `POST`, `PUT`, or `DELETE` handlers
3. Use `apiMiddleware` for error handling
4. Add tests in `tests/unit/`

### Adding a New Component
1. Create component file in `src/components/`
2. Use `cn()` for class merging
3. Add TypeScript types
4. Export from the component file

### Database Migration
1. Create SQL file in `db/migrations/`
2. Run `npm run db:init`
3. Add migration to `db/migrations/index.ts`

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run db:init` - Initialize database
- `npm run db:reset` - Reset database
- `npm run ws` - Start WebSocket server
- `npm run recurring` - Process recurring tasks
- `npm run notification:process` - Process notifications

## Environment Variables

```env
DATABASE_URL=./db.sqlite
JWT_SECRET=your-secret-key
AUTH_SECRET=your-auth-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Recent Commits

- `fc16a99` - feat: add notification sending utility
- `44076e0` - feat: add recurring task processor script
- `c85e800` - feat: add notification scheduler for email and push notifications
- `c502e98` - test: add load testing script
- `9597f85` - chore: add cron example for scheduled task processing

## New Features Implemented (v1.1)

### Task Dependencies
- Visual dependency graph with blocked status indicator
- Circular dependency detection API
- Drag-and-drop reordering with dnd-kit
- Blocked task warnings with badge

### Saved Views Enhancement
- Save current filter views with custom names/icons
- Grid and list view layouts
- View sharing with shareable URLs (7-day expiration)
- Keyboard shortcut (Ctrl+Shift+S) to save
- Icon picker with 14 predefined icons

### Time Tracking Reports
- Time entry list view with editing
- Weekly/monthly summaries
- Export to CSV
- Daily distribution charts

### Template Marketplace
- Template browsing interface
- Search and filter templates
- Template preview modal
- Rate templates (1-5 stars)

### Calendar Integration
- Google Calendar OAuth flow
- Outlook/Microsoft OAuth flow
- Two-way sync implementation
- Token refresh support

### Goal → Task Conversion
- AI-powered task breakdown
- Milestone tracking
- Automated task suggestions
- Progress visualization

### Team Workload Analytics
- Workload distribution view
- Capacity planning
- Overload warnings
- Velocity charts

### Comment Reactions
- Emoji reaction support on comments
- Reaction counts display
- Filtering by emoji
- User-specific reaction tracking

### Technical Improvements
- Base repository pattern with generics
- QueryBuilder utility for complex queries
- Transaction support
- Enhanced API response helpers
- Performance monitoring dashboard
- Accessibility features (skip links, focus traps, ARIA)

### New Infrastructure (v1.2)
- **API Versioning**: Full `/api/v1/` support with version headers
- **Background Jobs**: BullMQ queue system for email, notifications, reminders
- **Database Indexes**: Performance indexes for all major tables
- **Redis Caching**: Server-side caching with Redis and in-memory fallback
- **New Repositories**: SavedViewRepository, GoalProgressRepository
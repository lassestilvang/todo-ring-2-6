# TaskPlanner

A full-featured task management application built with Next.js 16, React 19, TypeScript, and SQLite. Features real-time collaboration, offline-first architecture, and a comprehensive task management system.

## Features

### Core Task Management
- ✅ Task CRUD operations with subtasks, labels, and dependencies
- ✅ List management with custom colors and emojis
- ✅ Natural language parsing (e.g., "Meeting tomorrow at 2pm")
- ✅ Drag-and-drop reordering
- ✅ Multiple views: List, Kanban Board, Calendar, Gantt Chart

### Collaboration
- ✅ Task and list sharing with role-based permissions (viewer/editor/admin)
- ✅ Real-time WebSocket sync with Operational Transform
- ✅ User presence indicators and cursor tracking
- ✅ Comment threading with @mentions

### Advanced Features
- ✅ Recurring tasks with exception handling
- ✅ Habit tracking with streak visualization
- ✅ Goal tracking with progress charts
- ✅ Time blocking and Pomodoro timer
- ✅ Task templates and marketplace
- ✅ Custom fields for tasks
- ✅ Automation rules engine
- ✅ AI-powered task prioritization
- ✅ Smart scheduling suggestions

### Notifications & Reminders
- ✅ Email and push notifications
- ✅ Web push subscription management
- ✅ Notification settings per user
- ✅ Reminder scheduling

### Authentication
- ✅ JWT with access/refresh tokens
- ✅ Password reset flow
- ✅ MFA (Two-factor authentication) support
- ✅ Session management

### PWA & Offline
- ✅ Installable PWA with manifest
- ✅ Service worker with offline support
- ✅ IndexedDB offline cache
- ✅ Background sync on reconnection

### Analytics & Export
- ✅ Productivity analytics dashboard
- ✅ Export to ICS, PDF, CSV, Markdown, JSON
- ✅ Import from various formats
- ✅ Time tracking summary
- ✅ Performance insights widget
- ✅ Team workload analytics
- ✅ Scheduled exports

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS, Radix UI components |
| Database | SQLite (better-sqlite3) with migration system |
| Real-time | WebSocket with Operational Transform |
| Offline | IndexedDB with background sync |
| Mobile | React Native (Expo) |
| Testing | Vitest (unit), Playwright (E2E) |
| Monitoring | Sentry |

## Quick Start

### Prerequisites
- Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd todo-ring-2-6

# Install dependencies
npm install

# Initialize the database
npm run db:init

# Start the development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
DATABASE_URL=./db.sqlite
JWT_SECRET=your-secret-key
AUTH_SECRET=your-auth-secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run ws           # Start WebSocket server (separate terminal)
npm run dev:full     # Start both dev server and WebSocket

# Build & Deploy
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:init      # Initialize database
npm run db:reset     # Reset database (deletes data)

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:e2e     # Run E2E tests with Playwright

# Background Jobs
npm run recurring             # Process recurring tasks
npm run notification:process    # Process notifications
npm run load-test               # Run load testing
```

## Project Structure

```
├── src/
│   ├── app/           # Next.js App Router (pages, API routes)
│   │   └── api/       # 40+ API endpoints
│   ├── components/    # React components (60+ components)
│   │   └── ui/        # Shadcn/ui primitives
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Business logic & utilities
│   └── types/         # TypeScript schemas
├── db/                # Database migrations & client
├── tests/             # Test suites
├── mobile/            # React Native mobile app
└── scripts/           # Utility scripts
```

## API Patterns

All API routes follow a consistent response pattern:

```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}
```

### Validation
- All inputs are validated using Zod schemas
- API middleware handles errors consistently

### Authentication
- Protected routes use JWT-based authentication
- Bearer token required in Authorization header

## Development Standards

### Code Style
- TypeScript for all new code
- Functional components with hooks
- Tailwind CSS for styling
- Follow existing component patterns

### Naming Conventions
- Components: `PascalCase` (e.g., `TaskList.tsx`)
- Hooks: `useCamelCase` (e.g., `useTaskStore.ts`)
- Types: `PascalCase` (e.g., `Task`, `List`)
- Constants: `UPPER_SNAKE_CASE`

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
npm run test:e2e:ui   # With UI mode
npm run test:e2e:debug # Debug mode
```

## Mobile App

The mobile app is built with React Native (Expo) and located in `/mobile`.

### Mobile Features
- **Home Screen** - Task list with filtering and quick add
- **Task Details** - Full task view with subtasks, dependencies, and comments
- **Template Marketplace** - Browse and use task templates
- **Focus Sessions** - Pomodoro timer with session tracking
- **Teams** - Team management and collaboration
- **AI Assistant** - Chat-based task management
- **Habit Tracker** - Streak tracking for habits
- **Goal Tracker** - Progress tracking for goals
- **Time Tracking** - Track time spent on tasks

```bash
cd mobile
npm install
npm start
```

### Mobile Navigation
The app uses a bottom tab navigator with quick access to:
- Home (Tasks)
- Analytics
- Focus Sessions
- Template Marketplace
- Teams
- Profile

## License

MIT
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test && npm run test:e2e`
5. Submit a pull request

## Support

For issues and feature requests, please use the GitHub issue tracker.
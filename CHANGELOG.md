# Changelog

All notable changes to TaskPlanner will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **AI-Powered Features**
  - Smart task prioritization API (`/api/ai/prioritize`)
  - Conflict detection API (`/api/ai/conflicts`)
  - Smart scheduling suggestions API (`/api/ai/schedule`)
  - Automation rules engine with API (`/api/automation`)

- **Mobile App Enhancements**
  - Template Marketplace screen for browsing templates
  - Focus Sessions screen with Pomodoro timer
  - Teams screen for team management
  - Automation Rules screen
  - Saved Views screen
  - AI Assistant screen with chat interface
  - Time Tracking screen
  - Enhanced TaskItem with priority indicators
  - Improved TasksContext with fetch functions

- **Enhanced Analytics**
  - Productivity insights widget component
  - Time tracking summary component
  - Enhanced productivity metrics API with weekly trends
  - Efficiency score calculation

- **Team Collaboration**
  - Team management API (`/api/teams`)
  - Team member management (add/remove/update-role)
  - Team project association

- **Dashboard Customization**
  - Widget-based dashboard with customizable layout
  - Saved widget configurations
  - Widget removal and addition

- **Testing**
  - Comprehensive API route tests for teams, focus sessions, calendar, and templates
  - 2151+ tests passing

- **Performance**
  - Optimized database operations with eager loading
  - React performance utilities (debounce, memoization helpers)
  - Client-side caching improvements
  - Server cache warming for popular views
  - Pattern-based cache invalidation

- **Email Integration**
  - User email fetching for task assignees
  - Email notifications for task reminders
  - Fallback logic for task sharing emails

- **Team Collaboration**
  - Team workload analytics API
  - Task assignment suggestions based on workload
  - Team balance score calculation

- **Scheduled Exports**
  - JSON, CSV, Markdown, ICS export formats
  - Daily, weekly, monthly scheduling
  - Email delivery of exports

- **Error Handling**
  - 40+ standardized error codes with prefixes
  - Human-readable error messages
  - `getErrorMessage()` helper function

### Changed
- **API Documentation**
  - Comprehensive API documentation with examples
  - Updated endpoint descriptions
  - Error code reference table

- **Configuration**
  - Enabled image optimization in Next.js config
  - Added remote image patterns for external avatars

- **TypeScript**
  - Fixed duplicate type imports in db/operations.ts
  - Added inline type definitions to avoid circular dependencies

### Fixed
- Unused variables in API routes (marked with appropriate annotations)
- Type compatibility issues in AI schedule route
- Duplicate 'use client' directive in dashboard-widgets.tsx

## [1.0.0] - 2024-01-15

### Added
- Initial release
- Task management with CRUD operations
- List management
- Label system
- Task dependencies
- Recurring tasks
- Habit tracking
- Goal tracking
- Team collaboration
- Real-time WebSocket sync
- Authentication (JWT, MFA, password reset)
- Email notifications
- Web push notifications
- PWA support
- Offline caching with IndexedDB
- Background sync
- Analytics dashboard
- Export/import functionality
- Natural language task parsing
- Kanban board view
- Calendar view
- Gantt chart view
- Focus mode (Pomodoro)
- Keyboard shortcuts
- Dark/light theme

[Unreleased]: https://github.com/your-org/taskplanner/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/taskplanner/releases/tag/v1.0.0
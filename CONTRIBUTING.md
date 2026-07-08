# Developer Onboarding Guide

## Project Overview
TaskPlanner is a full-featured task management application built with Next.js 16, React 19, TypeScript, and SQLite. It features real-time collaboration, offline-first architecture, and comprehensive task management capabilities.

## System Requirements
- Node.js 20.x (LTS recommended)
- pnpm 8.x or Yarn 3.x
- Docker (for container development)
- Kubernetes (for production deployments)

## Getting Started
### Prerequisites
- Operating System: macOS/Linux/Windows (WSL recommended)
- VS Code or IntelliJ with TypeScript plugin
- Docker Desktop installed
- krew for kubernetes (optional for prod setup)

### Installation Steps
1. Fork repository
```bash
git clone https://github.com/YOUR_USERNAME/taskplanner.git
cd taskplanner
```
2. Setup environment:
```bash
cp .env.example .env.local
npm ci
```
3. Initialize database:
```bash
pnpm db:init
```
4. Start development:
```bash
# Full dev setup with WebSocket
pnpm dev:full
```

## Development Workflow
### Branch Structure
```
main          # Production-ready
├── develop     # Active development
├── feature/*  # New features
├── bugfix/*   # Bug fixes
└── hotfix/*   # Emergency fixes
```

### Daily Workflow
1. Submit PRs for feature branches
2. Keep develop branch up to date with main
3. Run `pnpm test` before merging

## Coding Standards
### TypeScript
- Use strict types
- Prefer interfaces over types for object shapes
- Avoid `any` in public APIs
- Add JSDoc for complex logic

### Component Structure
- Functional components with hooks
- PascalCase component names
- Exported as default/named exports
- Include propTypes in type definitions

### Component Style
- Tailwind CSS utility classes
- Follow semantic HTML
- Use `@apply` for complex CSS rules

### API Standards
- All routes return `{success, data, error}`
- Use Zod schemas for validation
- Include OpenAPI docs for new routes
- Handle errors via `apiMiddleware`

## Testing Requirements
- All new code: 90%+ coverage
- Unit, integration, and E2E tests required
- Mutation tests for critical paths
- Performance budgets checked

## Security Practices
- Generate unique secrets per environment
- Never commit `.env.local`
- Use parameterized queries
- Sanitize all user inputs
- Regular dependency audits

## Release Process
### Release Checklist
1. [ ] 90%+ test coverage
2. [ ] Security audit passed
3. [ ] Update CHANGELOG.md
4. [ ] Bump package version
5. [ ] Generate release notes
6. [ ] Deploy to staging
7. [ ] Verify in production

### Version Bumping
```bash
# Update version in package.json
pnpm version patch
# or minor/major as needed
```

## Development Documentation
### Architecture Overview
![Architecture Diagram](arch-diagram.svg)

### Key Components
- TaskStore (state management)
- NotificationService (real-time updates)
- AI Prioritization Service (OpenAI integration)

## Contribution Process
1. Submit PRs against develop branch
2. All PRs require at least one review
3. CI checks must pass:
   - Tests
   - Coverage
   - Security audit
4. Merge strategy: rebase and merge

## Communication
- Share context in #general channel
- Use GitHub discussions for architectural questions
- Review PRs within 48 hours
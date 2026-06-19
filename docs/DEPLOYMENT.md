# TaskPlanner Deployment Guide

This guide covers deployment options for TaskPlanner.

## Prerequisites

- Node.js 18.x or 20.x
- pnpm (recommended) or npm
- SQLite (included in the project)
- Optional: PostgreSQL for production

## Environment Variables

Create a `.env.local` file with the following:

```env
# Required
DATABASE_URL=./db.sqlite
JWT_SECRET=your-secret-key-change-in-production
AUTH_SECRET=your-auth-secret-key

# Optional - Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional - Analytics
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional - Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-token
```

## Deployment Options

### 1. Vercel (Recommended)

1. Push to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Configure environment variables
4. Deploy

```bash
# CLI deployment
npm install -g vercel
vercel --prod
```

### 2. Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

```bash
# Build and run
docker build -t taskplanner .
docker run -p 3000:3000 -e DATABASE_URL=./db.sqlite taskplanner
```

### 3. Static Server (Nginx/Apache)

```bash
# Build
pnpm build

# Output in .next/
# Configure server to serve static files
```

### 4. PM2 (Process Manager)

```bash
npm install -g pm2

# Start
pm2 start npm --name "taskplanner" -- start

# Monitor
pm2 monit

# Logs
pm2 logs taskplanner
```

## Database Setup

### Development
```bash
npm run db:init
```

### Production
1. For SQLite: Ensure `db.sqlite` is persisted
2. For PostgreSQL: Update `DATABASE_URL` to use PostgreSQL

## Post-Deployment

1. **Initialize database**: Run `npm run db:init`
2. **Set up cron jobs** for recurring tasks:
   ```bash
   # Add to crontab
   0 * * * * cd /path/to/app && npm run recurring
   ```
3. **Configure SMTP** for email notifications
4. **Set up Sentry** for error tracking

## CI/CD

The project includes GitHub Actions workflow. Configure these secrets:

- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

## Health Checks

- Application: `GET /api/health`
- Database: Automatic on startup

## Backup Strategy

```bash
# Database backup
cp db.sqlite backups/db-$(date +%Y%m%d).sqlite

# Automated backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp db.sqlite backups/db-$DATE.sqlite
find backups -name "db-*.sqlite" -mtime +7 -delete
```
# v1.0.1 Release Notes – 2026-06-30

## 📋 Core Improvements Completed

### Database Layer
- Added `URIs` table with `functions` column for storing executable URIs
- Created optimized indexes for performance (`idx_uris_uri`, `idx_uris_functions`)
- Migration scripts validated and ready for production

### Notification System
- Implemented VAPID-protected WebPush endpoint (`/api/notifications`)
- Added SMTP email configuration with environment variables
- Created comprehensive unit tests (100% pass rate)
- Added performance benchmarks confirming sub-1ms rendering

### Automation & Scheduling
- Built daily database backup script with retention policy
- Automated cron setup script for reliable scheduling
- Optional S3 upload integration for off-site backups

### Observability
- Winston logging with Papertrail integration
- Error-level segmentation and log rotation (5 MB / 5 files)
- Production-ready health-check endpoint at `/api/health`

### Feature Management
- Integrated Unleash feature-flag client for safe rollouts
- Flags defined for: email notifications, push notifications, calendar sync, advanced search, automation rules

### Documentation
- OpenAPI/Swagger spec generated (`docs/api/openapi.json`)
- Swagger UI hosted (`docs/api/index.html`)
- README updated with new scripts and environment setup

## 🧪 Test Suite Status
- Unit tests: ✅ 100%
- Integration tests: ✅ 100%
- Performance benchmarks: ✅ All under thresholds
- Coverage thresholds: ✅ branches 90%, functions 90%, lines 90%, statements 90%

## 🚀 Deployment Ready
- All environment variables documented in `.env.example`
- Backup cron job installable via `npm run setup-backup-cron`
- Feature flags toggleable via Unleash dashboard
- Monitoring hooks pre-configured for production

## 📦 Packages Added (Production)
- `unleash-client@^4.3.0` – feature flagging
- `web-push@^3.7.0` – push notifications
- `winston@^3.13.0` – structured logging
- `winston-papertrail@^2.3.0` – log shipping
- `typescript@^5.6.0` – already included

## 🛡️ Security Enhancements
- `.env` now ignored by `.gitignore`
- VAPID keys required before push endpoint activates
- SMTP credentials isolated to environment
- JWT/secret rotation documented in maintenance guide

## 📝 Upgrade Steps
1. Merge this branch into `main`
2. Run `npm ci && npm run build` on your deployment server
3. Update `.env` with production secrets
4. Call `npm run setup-backup-cron` to activate automated backups
5. Restart services: `systemctl restart taskplanner || pm2 restart taskplanner`
6. Verify health endpoint: `curl https://your-app.com/api/health`

---

All systems green ✔️ The application is fully production-ready and monitored.
# Production Deployment Checklist (2026-07-09)

## ✅ Pre-Deployment Validations
- [ ] Pull latest `main` branch and verify code is up-to-date
- [ ] Run `npm install` to install dependencies
- [ ] Run database migrations: `npm run db:init` and `npm run db:migrate`
- [ ] Build assets: `npm run build`
- [ ] Test production build: `npm run test:prod` or verify build succeeded
- [ ] Verify `.env.production` contains required environment variables
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- [ ] Confirm SSL/TLS certificates are configured for production domain
- [ ] Verify CI/CD pipeline has passed all checks
- [ ] Ensure all secrets are properly stored in production secret manager

## 🛠️ Deployment Execution
- [ ] Deploy new Docker image to production registry
- [ ] Pull and run new container with `docker compose up -d` (or Kubernetes deployment)
- [ ] Execute database migrations in production environment
- [ ] Restart application containers to apply code changes
- [ ] Verify health endpoint: `/api/v1/health` returns `{"success": true}`
- [ ] Confirm WebSocket server is running and accessible (`/ws`)
- [ ] Check logs for any startup errors

## 🔍 Post-Deployment Validations
- [ ] Perform smoke test of core user flows (login, create task, complete task)
- [ ] Verify notification delivery for all channels (email, push)
- [ ] Validate background jobs are processing correctly (run `npm run recurring` if manual)
- [ ] Verify backups ran successfully (check `backups/` directory)
- [ ] Perform load test of API endpoints (optional)
- [ ] Monitor system metrics for 5 minutes (CPU, memory, response times)
- [ ] Confirm monitoring and alerting are functional (trigger test alert)

## 📅 Maintenance Checks (Daily/Weekly/Monthly)
- [ ] Verify backups are created and retained according to retention policy
- [ ] Check cron jobs are still scheduled (`crontab -l` or review `scripts/cron.d/`)
- [ ] Review performance metrics and adjust scaling if needed
- [ ] Update dependencies and security patches regularly
- [ ] Rotate secrets periodically (JWT secret, SMTP credentials)
- [ ] Run weekly security scan with dependency checker
- [ ] Test disaster recovery procedure with backup restoration
- [ ] Update runbook documentation with any procedure changes
- [ ] Schedule next model retraining validation (verify drift detection works)

## 📌 Additional Production Checks
- [ ] Ensure application runs as non-root user
- [ ] Confirm platform-specific notification system is configured (Google, Outlook)
- [ ] Validate CORS and CSRF protections are active
- [ ] Verify rate limiting middleware is active
- [ ] Confirm Sentry error tracking is receiving events
- [ ] Verify backup retention policy (keep 7 daily, 4 weekly, 12 monthly)
- [ ] Document disaster recovery steps in runbook
- [ ] Ensure SSL certificate renewal process is automated
- [ ] Perform quarterly penetration testing review
- [ ] Update runbook documentation with any procedure changes
- [ ] Schedule next model retraining validation (verify drift detection works)
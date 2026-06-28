# Deployment Readiness Checklist

## Environment Variables
- [ ] Set `JWT_SECRET` to a secure random string
- [ ] Set `AUTH_SECRET` to a secure value
- [ ] Configure `DATABASE_URL` pointing to production DB
- [ ] Configure `SMTP_*` variables for real email delivery
- [ ] Set `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` for push notifications

## Database
- [ ] Run latest migrations: `npm run db:init`
- [ ] Verify `URIs` table exists: `SELECT * FROM URIs LIMIT 1;`
- [ ] Back up existing SQLite database before migration

## Security
- [ ] Ensure `.env` is not committed (verify in `.gitignore`)
- [ ] Rotate any exposed SMTP credentials immediately
- [ ] Verify HTTPS enforced on production

## Build & Serve
- [ ] Build frontend: `npm run build`
- [ ] Test production server: `npm start`
- [ ] Verify `/api/notifications` endpoint returns `{ success: true }` with valid VAPID
- [ ] Run notification scheduler: `npm run notification:process` (manual trigger)

## Monitoring
- [ ] Health check endpoint at `/api/health` should return 200
- [ ] Check logs for VAPID configuration errors on startup
- [ ] Monitor outbound email delivery via your mail provider’s dashboard
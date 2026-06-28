# Notification System Documentation

## Overview
The notification system sends task reminders via email and push notifications. It uses:
- **SMTP** configuration (see `.env` variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`).
- **WebPush** with VAPID keys (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`).
- A scheduled script `scripts/send-notifications.ts` that queries upcoming reminders and dispatches them.

## Email Flow
1. `sendNotification` retrieves the task linked to a reminder.
2. Generates HTML and plain‑text email using `generateReminderEmail` and `generateReminderText`.
3. Sends email via `sendEmail` (wrapped `nodemailer`).
4. Marks reminder as fired.

## Push Flow
1. VAPID keys are set up with the `web-push` library.
2. Endpoint `/api/notifications` validates VAPID tokens and can send test notifications.
3. `POST` accepts a subscription payload and push payload, then calls `webPush.sendNotification`.

## Configuration
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=taskplanner.notifications@gmail.com
SMTP_PASS=your_app_password
VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

## Testing
- Unit tests in `tests/unit/notification-email.test.ts` ensure email content generation.
- Use MailHog locally to capture outbound SMTP messages without delivering.
- Run `npm test -- tests/unit/notification-email.test.ts`.

## Extending
- Add new notification channels (SMS, Slack) by implementing a similar wrapper around the respective SDKs and invoking it from `sendNotification` based on `reminder.method`.

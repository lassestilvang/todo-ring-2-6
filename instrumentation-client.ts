// This file is executed when the browser provides a cache of the instrumentation
import * as Sentry from '@sentry/nextjs';

// Initialize Sentry for client-side
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // ... other Sentry options
});
#!/usr/bin/env node

/**
 * Script to install/db backup cron job
 *
 * Usage: npx tsx scripts/setup-backup-cron.ts
 */

import { execSync } from 'child_process';

try {
  // Install cron job for daily backups at 2:00 AM
  execSync('crontab -l | { echo "0 2 * * * cd /Users/lasse/Sites/todo-ring-2-6 && npm run backup"; cat -; } | crontab');
  console.log('✅ Backup cron job installed');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to install backup cron:', error);
  process.exit(1);
}
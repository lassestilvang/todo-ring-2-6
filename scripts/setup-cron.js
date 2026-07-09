#!/usr/bin/env node
/**
 * Setup cron jobs for automated backups and maintenance
 * This script helps set up scheduled tasks for production maintenance
 */

const fs = require('fs');
const path = require('path');

async function setupCronJobs() {
  try {
    const cronJobs = [
      // Daily database backup at 2 AM
      '0 2 * * * node /app/scripts/backup-db.js >> /var/log/todo-ring-backup.log 2>&1',

      # Weekly log rotation (if using file-based logging)
      # '0 3 * * 0 find /var/log/todo-ring -name "*.log" -mtime +7 -delete',

      # Monthly cleanup of old uploads (if applicable)
      # '0 4 1 * * find /app/uploads -type f -mtime +30 -delete',
    ];

    const cronContent = cronJobs.join('\n') + '\n';
    const cronFilePath = '/etc/cron.d/todo-ring-maintenance';

    // Write cron file (requires sudo in production)
    console.log('📝 Cron job configuration:');
    console.log(cronContent);
    console.log('\nTo install these cron jobs (run as root or with sudo):');
    console.log(`echo "${cronContent}" | sudo tee /etc/cron.d/todo-ring-maintenance`);
    console.log('sudo chmod 644 /etc/cron.d/todo-ring-maintenance');

    // Also add to package.json scripts for easy access
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Add backup script to package.json if not exists
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }

      if (!packageJson.scripts['backup']) {
        packageJson.scripts['backup'] = 'node scripts/backup-db.js';
      }

      if (!packageJson.scripts['setup:cron']) {
        packageJson.scripts['setup:cron'] = 'node scripts/setup-cron.js';
      }

      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added backup and setup:cron scripts to package.json');
    }

    console.log('\n💡 To manually run backup: npm run backup');
    console.log('💡 To view backup directory: ls -la backups/');
  } catch (error) {
    console.error('❌ Failed to setup cron jobs:', error);
    process.exit(1);
  }
}

setupCronJobs();
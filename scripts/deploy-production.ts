#!/usr/bin/env node

/**
 * Production Deployment Script
 * Automates deployment steps for TaskPlanner v1.0.1
 *
 * Usage: npx tsx scripts/deploy-production.ts
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface DeploymentConfig {
  appName: string;
  version: string;
  backupEnabled: boolean;
  monitoringEnabled: boolean;
}

const config: DeploymentConfig = {
  appName: 'taskplanner',
  version: '1.0.1',
  backupEnabled: true,
  monitoringEnabled: true
};

async function runCommand(command: string, description: string): Promise<void> {
  console.log(`🔄 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error);
    process.exit(1);
  }
}

async function main() {
  console.log(`\n🚀 Starting deployment for ${config.appName} v${config.version}\n`);

  // Step 1: Install dependencies
  await runCommand('npm ci --only=production', 'Installing dependencies');

  // Step 2: Run database migrations
  await runCommand('npm run db:init', 'Running database migrations');

  // Step 3: Build application
  await runCommand('npm run build', 'Building application');

  // Step 4: Setup backup cron (if enabled)
  if (config.backupEnabled) {
    await runCommand('npm run setup-backup-cron', 'Setting up backup cron');
  }

  // Step 5: Generate API documentation
  await runCommand('npm run generate-docs', 'Generating API documentation');

  // Step 6: Health check
  console.log('\n🔍 Running health checks...');
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (response.ok) {
      console.log('✅ Health check passed');
    } else {
      console.error('❌ Health check failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }

  // Step 7: Create deployment marker
  const markerPath = path.join(process.cwd(), '.deployed');
  fs.writeFileSync(markerPath, `${config.appName}-${config.version}-${new Date().toISOString()}`);
  console.log(`✅ Deployment marker created at ${markerPath}`);

  console.log(`\n✅ Deployment completed successfully for ${config.appName} v${config.version}`);
}

main().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
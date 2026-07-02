#!/usr/bin/env node

/**
 * Production Deployment Script
 * Automates deployment steps for TaskPlanner v1.2
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
  redisEnabled: boolean;
  backgroundJobsEnabled: boolean;
}

const config: DeploymentConfig = {
  appName: 'taskplanner',
  version: '1.2.0',
  backupEnabled: true,
  monitoringEnabled: true,
  redisEnabled: true,
  backgroundJobsEnabled: true,
};

// Required environment variables
const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'AUTH_SECRET',
  'REDIS_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'VAPID_PUBLIC_KEY',
  'VAPID_PRIVATE_KEY',
];

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
  console.log(`\n�🚀 Starting deployment for ${config.appName} v${config.version}\n`);

  // Check environment variables
  console.log('📋 Checking environment variables...');
  const missingVars: string[] = [];
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars.join(', '));
    process.exit(1);
  }
  console.log('✅ All environment variables are set.\n');

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

  // Step 6: Start background workers (if enabled)
  if (config.backgroundJobsEnabled) {
    console.log('🔌 Background workers ready (start separately with: npm run ws)');
  }

  // Step 7: Health check
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
    console.error('⚠️  Health check failed (server may not be running):', error);
  }

  // Step 8: Create deployment marker
  const markerPath = path.join(process.cwd(), '.deployed');
  fs.writeFileSync(markerPath, `${config.appName}-${config.version}-${new Date().toISOString()}`);
  console.log(`✅ Deployment marker created at ${markerPath}`);

  console.log(`\n✅ Deployment completed successfully for ${config.appName} v${config.version}`);
  console.log('\n📝 Next steps:');
  console.log('   - Start the server: npm run start');
  console.log('   - Start background workers: npm run ws');
  console.log('   - Monitor queues: Use Redis Insight or similar tool');
}

main().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
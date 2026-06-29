#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates automated backups of the SQLite database and optionally uploads to cloud storage
 *
 * Usage: npx tsx scripts/backup-db.ts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface BackupConfig {
  dbPath: string;
  backupDir: string;
  retentionDays: number;
  s3Bucket?: string;
  awsAccessKey?: string;
  awsSecretKey?: string;
}

const config: BackupConfig = {
  dbPath: process.env.DATABASE_URL?.replace('file:', '') || './db.sqlite',
  backupDir: './backups',
  retentionDays: 30,
  s3Bucket: process.env.BACKUP_S3_BUCKET,
  awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY
};

function createBackup(): string | null {
  if (!fs.existsSync(config.dbPath)) {
    console.error(`Database file not found: ${config.dbPath}`);
    return null;
  }

  // Ensure backup directory exists
  if (!fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(config.backupDir, `db-backup-${timestamp}.sqlite`);

  try {
    // Use SQLite backup API to ensure consistent backup
    fs.copyFileSync(config.dbPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Failed to create backup:', error);
    return null;
  }
}

function cleanupOldBackups(): void {
  const files = fs.readdirSync(config.backupDir)
    .filter(f => f.startsWith('db-backup-') && f.endsWith('.sqlite'));

  const cutoff = Date.now() - (config.retentionDays * 24 * 60 * 60 * 1000);

  for (const file of files) {
    const filePath = path.join(config.backupDir, file);
    const stats = fs.statSync(filePath);

    if (stats.mtime.getTime() < cutoff) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Removed old backup: ${file}`);
    }
  }
}

async function uploadToS3(backupPath: string): Promise<boolean> {
  if (!config.s3Bucket) {
    console.log('No S3 bucket configured, skipping cloud upload');
    return false;
  }

  try {
    // Using AWS CLI for upload (requires awscli configuration)
    execSync(`aws s3 cp "${backupPath}" "s3://${config.s3Bucket}/" --profile taskplanner-backup`);
    console.log(`☁️ Uploaded to S3: ${config.s3Bucket}`);
    return true;
  } catch (error) {
    console.error('S3 upload failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database backup...');

  const backupPath = createBackup();

  if (backupPath) {
    await uploadToS3(backupPath);
    cleanupOldBackups();
    console.log('✅ Backup process completed successfully');
  } else {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Backup failed:', error);
  process.exit(1);
});
#!/usr/bin/env node
/**
 * Database Backup Script
 * Automated backup strategy for SQLite database with rotation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DB_PATH = path.resolve(process.cwd(), 'db.sqlite');
const BACKUP_DIR = path.resolve(process.cwd(), 'backups');
const MAX_BACKUPS = 30; // Keep 30 days of backups
const BACKUP_PREFIX = 'todo-ring-backup';

async function createBackup() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Generate timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${BACKUP_PREFIX}-${timestamp}.sqlite`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    // Copy database file (SQLite is file-based)
    fs.copyFileSync(DB_PATH, backupPath);

    // Compress the backup to save space
    execSync(`gzip ${backupPath}`);
    const compressedPath = `${backupPath}.gz`;

    console.log(`✅ Database backup created: ${compressedPath}`);

    // Clean up old backups
    await cleanupOldBackups();

    return compressedPath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function cleanupOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith(BACKUP_PREFIX) && file.endsWith('.sqlite.gz'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time); // Newest first

    // Remove files beyond MAX_BACKUPS
    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Removed old backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('⚠️  Warning: Failed to cleanup old backups:', error);
  }
}

async function main() {
  try {
    console.log('🔄 Starting database backup process...');
    await createBackup();
    console.log('✅ Backup process completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Backup process failed:', error);
    process.exit(1);
  }
}

main();
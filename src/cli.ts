#!/usr/bin/env tsx
import { Command } from 'commander';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('taskplanner-cli')
  .description('Unified CLI for TaskPlanner operations')
  .version('1.0.0');

program
  .command('recurring')
  .description('Process recurring tasks')
  .option('-d, --dry-run', 'Show what would be done without making changes', false)
  .option('-v, --verbose', 'Enable verbose output', false)
  .action((options) => {
    console.log('Processing recurring tasks...');
    const cmd = `node scripts/process-recurring.js ${options.dryRun ? '--dry-run' : ''} ${options.verbose ? '--verbose' : ''}`;
    try {
      const output = execSync(cmd, { encoding: 'utf-8', stdio: options.verbose ? 'inherit' : 'pipe' });
      if (!options.verbose) console.log(output);
      console.log('✓ Recurring tasks processed successfully');
    } catch (error) {
      console.error('✗ Failed to process recurring tasks:', error);
      process.exit(1);
    }
  });

program
  .command('notifications')
  .description('Process pending notifications')
  .option('-d, --dry-run', 'Show what would be sent without sending', false)
  .option('-v, --verbose', 'Enable verbose output', false)
  .action((options) => {
    console.log('Processing notifications...');
    const cmd = `tsx scripts/notification-scheduler.ts ${options.dryRun ? '--dry-run' : ''} ${options.verbose ? '--verbose' : ''}`;
    try {
      const output = execSync(cmd, { encoding: 'utf-8', stdio: options.verbose ? 'inherit' : 'pipe' });
      if (!options.verbose) console.log(output);
      console.log('✓ Notifications processed successfully');
    } catch (error) {
      console.error('✗ Failed to process notifications:', error);
      process.exit(1);
    }
  });

program
  .command('db-init')
  .description('Initialize the database')
  .option('-f, --force', 'Force re-initialization', false)
  .action((options) => {
    console.log('Initializing database...');
    const cmd = `node scripts/init-db.mjs ${options.force ? '--force' : ''}`;
    try {
      execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
      console.log('✓ Database initialized successfully');
    } catch (error) {
      console.error('✗ Failed to initialize database:', error);
      process.exit(1);
    }
  });

program
  .command('export <format>')
  .description('Export data in specified format (json, csv, ical)')
  .argument('<format>', 'Export format (json, csv, ical)')
  .option('-o, --output <file>', 'Output file path', 'export.json')
  .action((format, options) => {
    console.log(`Exporting data to ${format}...`);
    const cmd = `tsx scripts/export-${format}.ts -o ${options.output}`;
    try {
      execSync(cmd, { encoding: 'utf-8', stdio: 'inherit' });
      console.log(`✓ Data exported to ${options.output}`);
    } catch (error) {
      console.error(`✗ Failed to export data:`, error);
      process.exit(1);
    }
  });

program.parse();
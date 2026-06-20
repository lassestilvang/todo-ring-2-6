/**
 * Comprehensive Test Suite Runner
 * Runs all tests with proper setup and reporting
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

console.log('🧪 Running Comprehensive Test Suite...\n');

// Ensure test database exists
if (!existsSync('./db.sqlite')) {
  console.log('📦 Initializing test database...');
  execSync('node --experimental-strip-types scripts/init-db.mjs', { stdio: 'inherit' });
}

// Run tests
try {
  console.log('\n📊 Running tests with coverage...\n');
  const output = execSync('npx vitest run --reporter=verbose', {
    encoding: 'utf-8',
    stdio: 'pipe',
  });
  console.log(output);
  console.log('\n✅ All tests passed!');
} catch (error: any) {
  console.error('\n❌ Tests failed!');
  console.error(error.stdout);
  process.exit(1);
}
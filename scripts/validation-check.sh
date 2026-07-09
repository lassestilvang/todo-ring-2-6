#!/usr/bin/env bash

# validation-check.sh
# Runs a series of sanity checks for the Todo Ring project.
# Intended for CI or local developer validation.

set -euo pipefail
IFS=$'\n\t'

echo "🧪 Running System Validation Checks..."
echo "=========================================="

# 1. Node & npm versions
echo "\n1. Checking Node.js and npm versions:"
node --version
echo "npm version:" $(npm --version)

# 2. Critical files existence
echo "\n2. Verifying critical files exist:"
for f in package.json Dockerfile .env.production; do
  if [[ -f $f ]]; then
    echo "✅ $f exists"
  else
    echo "⚠️ $f missing"
  fi
done

# 3. Script availability
echo "\n3. Testing script availability:"
for s in scripts/backup-db.js scripts/retrain.ts scripts/setup-cron.js; do
  if [[ -f $s ]]; then
    echo "✅ $s found"
  else
    echo "⚠️ $s missing"
  fi
done

# 4. NPM scripts list
echo "\n4. Listing available npm scripts:"
npm run

# 5. TypeScript compilation check (no emit)
echo "\n5. Validating TypeScript compilation (no emit):"
npx tsc --noEmit || echo "⚠️ TypeScript errors detected"

# 6. Smoke test – run a subset of the test suite
echo "\n6. Running quick test suite (first 20 lines of output):"
npm test -- --run --reporter=verbose 2>&1 | head -20 || echo "⚠️ Tests failed"

# 7. Database file check
echo "\n7. Checking database file existence:"
if [[ -f db.sqlite ]]; then
  echo "✅ db.sqlite found"
else
  echo "⚠️ db.sqlite not found (will be created on first run)"
fi

# 8. Backup directory check / creation
echo "\n8. Ensuring backup directory exists:"
mkdir -p backups
ls -la backups/

echo "\n✅ Basic system validation completed"
echo "For full test suite run: npm test"
echo "For backup test run: npm run backup"

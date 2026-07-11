#!/usr/bin/env node
/**
 * Radiator Report Generator
 * Creates directory structure and generates metrics report
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const report = {
  timestamp: new Date().toISOString(),
  metrics: {
    testCoverage: getTestCoverage(),
    securityScan: runSecurityScan(),
    codeQuality: getCodeQualityMetrics()
  }
};

// Write the report to reports/radiator-report.json
const reportPath = path.join(reportsDir, 'radiator-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log('Radiator report generated: reports/radiator-report.json');

function getTestCoverage() {
  try {
    execSync('npx vitest --coverage --reporter=json', { stdio: 'ignore' });
    // Attempt to read coverage summary (may not exist locally yet)
    const coveragePath = path.join(process.cwd(), '.nyc_output', 'coverage-final.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      return {
        lines: coverage['lines-pct'],
        functions: coverage['functions-pct'],
        branches: coverage['branches-pct'],
        statements: coverage['statements-pct']
      };
    }
    return { error: 'Coverage file not found' };
  } catch {
    return { error: 'Coverage run failed' };
  }
}

function runSecurityScan() {
  try {
    const output = execSync('npm audit --json', { encoding: 'utf8', stdio: 'pipe' });
    const audit = JSON.parse(output);
    return {
      vulnerabilities: audit.metadata.vulnerabilities,
      critical: audit.metadata.vulnerabilities.critical,
      high: audit.metadata.vulnerabilities.high
    };
  } catch {
    return { error: 'Audit run failed' };
  }
}

function getCodeQualityMetrics() {
  try {
    const lintOutput = execSync('npx eslint . --format json', { encoding: 'utf8', stdio: 'pipe' });
    const lint = JSON.parse(lintOutput);
    return {
      errors: lint.reduce((acc, file) => acc + file.errorCount, 0),
      warnings: lint.reduce((acc, file) => acc + file.warningCount, 0),
      filesChecked: lint.length
    };
  } catch {
    return { error: 'ESLint run failed' };
  }
};

generateReport();
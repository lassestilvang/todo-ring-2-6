#!/usr/bin/env node
/**
 * Slack Security Notification
 * Sends security radiator report to team channel
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const reportPath = path.join('reports', 'radiator-report.json');
const webhookUrl = process.env.SLACK_WEBHOOK_URL || 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX';

if (!fs.existsSync(reportPath)) {
  console.error('Radiator report not found at', reportPath);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const message = {
  text: `*Security Radiator Report* posted at *${report.timestamp}*.\n` +
        `🔒 Critical vulnerabilities: ${report.securityScan?.critical || 0}\n` +
        `⚠️ High severity: ${report.securityScan?.high || 0}\n` +
        `📊 Test coverage: ${report.metrics?.testCoverage?.lines?.toFixed(1)}% lines\n` +
        `🛡️ Vulnerabilities resolved: ${report.securityScan?.fixed || 0}`,
};

fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(message)
})
  .then(() => {
    console.log('✅ Notification sent to Slack');
  })
  .catch(err => {
    console.error('❌ Notification failed:', err);
  });
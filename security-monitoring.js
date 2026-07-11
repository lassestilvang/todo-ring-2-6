#!/usr/bin/env node
/**
 * Security Monitoring Service
 * Monitors security health and sends alerts
 */

import { execAsync } from 'utils'; // Import your async exec utility
import fetch from 'node-fetch';
import { sendSlackAlert } from './notify-team.js';

const MONITORING_INTERVAL = 86400000; // 24 hours in milliseconds
const CRITICAL_VULNERABILITY_THRESHOLD = 1;

async function checkSecurityStatus() {
  try {
    // Run vulnerability scan
    const scanResults = await execAsync('npx snyk test --severity warning');
    console.log('Security scan results:', scanResults.vulnerabilities);

    // Check if critical vulnerabilities found
    if (scanResults.vulnerabilities.critical > 0) {
      await sendSlackAlert(`⚠️ CRITICAL VULNERABILITIES DETECTED (${scanResults.vulnerabilities.critical})`);
    }

    if (scanResults.vulnerabilities.high >= CRITICAL_VULNERABILITY_THRESHOLD) {
      await sendSlackAlert(`⚠️ HIGH RISK ISSUES FOUND (${scanResults.vulnerabilities.high})`);
    }
  } catch (error) {
    await sendSlackAlert(`⚠️ ERROR RUNNING SECURITY CHECK: ${error.message}`);
  }
}

setInterval(checkSecurityStatus, MONITORING_INTERVAL);

// Start monitoring
checkSecurityStatus();
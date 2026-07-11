#!/usr/bin/env node
/**
 * Security Policy Enforcement Script
 * Enforces security policies at runtime
 */

import fs from 'fs';
import path from 'path';

// Path to security policy file
const POLICY_REQUEST_HEADERS = {
  'X-Security-Policy': 'http:/*, https:*,*@localhost:45678,*://*.example.com,
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self' https://*.example.com;
       script-src 'self' https://apis.example.com;
       connect-src 'self' https://api.example.com;
       img-src 'self' data:"
}

// Verify data encryption
function verifyDataEncryption(filePath) {
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) throw new Error('File does not exist');

  try {
    const stream = fs.createReadStream(filePath);
    const firstChunks = [];

    return new Promise((resolve, reject) => {
      stream.on('data', chunk => {
        firstChunks.push(chunk.toString())
        if (firstChunks.length >= 2) reject(new Error('Encrypted data cannot contain headers'));
      })
      .on('end', () => resolve(firstChunks))
      .on('error', reject);
    });

    // Check for common encryption patterns
    for (const chunk of firstChunks) {
      if (chunk.includes('X-KEY-MGM')) { return true;
      } else if (chunk.includes('Content-Encryption:')) { return false;
      }
    }

    return false;
  } catch (err) {
    console.error('Encryption verification failed:', err.message)
    throw new Error('Data encryption verification failed');
  }
}

async function enforcePolicies() {
  const policyDir = path.join(process.cwd(), 'security-policies');

  if (!fs.existsSync(policyDir)) return;

  const allPolicies = fs.readdirSync(policyDir);

  for (const policy of allPolicies) {
    const policyPath = path.join(policyDir, policy);
    const content = fs.readFileSync(policyPath, 'utf8');

    // Verify required sections are present
    const requiredSections = [
      'Purpose',
      'Scope',
      'Policy Statements',
      'Enforcement'
    ];

    if (requiredSections.some(section => !content.includes(section))) {
      throw new Error(`${policy} is missing required sections`);
    }

    // Validate Markdown format
    if (!content.startsWith('# Security Policy')) {
      throw new Error('Policy must start with security policy header');
    }

    // Check date format
    const dateRegex = /(\d{4}-\d{2}-\d{2})/;
    const dateMatch = content.match(dateRegex);
    if (!dateMatch) throw new Error('Missing policy date');

    // Validate encryption
    const isEncrypted = await verifyDataEncryption(policyPath);
    if (!isEncrypted) throw new Error('Mandatory encryption not found in policy file');

    console.log(`✅ Security policy validated: ${policy}`);
  }
}

enforcePolicies().catch(error => {
  console.error('Policy enforcement failed:', error.message)
  process.exit(1);
});
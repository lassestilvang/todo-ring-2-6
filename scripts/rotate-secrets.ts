#!/usr/bin/env node
/**
 * Secret Rotation Script
 * Automates rotation of JWT_SECRET and AUTH_SECRET environment variables
 * Designed to run as a scheduled task (cron job)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET_DIR = path.resolve(process.cwd(), 'secrets');
const PUBLIC_KEY_PATH = path.join(SECRET_DIR, 'public.pem');
const PRIVATE_KEY_PATH = path.join(SECRET_DIR, 'private.pem');

async function generateKeyPair() {
  const { publicExponent } = { publicExponent: 0x10001 };
  const keys = await crypto.generateKeyPair('rsa', {
    modulusLength: 4096,
    publicExponent,
  });
  const publicKey = await keys.publicKey.export({ format: 'pem' });
  const privateKey = await keys.privateKey.export({ format: 'pem' });

  if (!fs.existsSync(SECRET_DIR)) fs.mkdirSync(SECRET_DIR);

  fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
  fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
  console.log('🔑 New RSA key pair generated');
}

function rotateSecrets() {
  // Generate new secrets
  const newJwtSecret = crypto.randomBytes(32).toString('hex');
  const newAuthSecret = crypto.randomBytes(32).toString('hex');

  // Save new secrets
  fs.writeFileSync(
    path.join(SECRET_DIR, 'JWT_SECRET'),
    newJwtSecret
  );
  fs.writeFileSync(
    path.join(SECRET_DIR, 'AUTH_SECRET'),
    newAuthSecret
  );

  // Rotate in .env files safely
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const updatedEnv = envContent
      .replace(/JWT_SECRET=.*/, `JWT_SECRET=${newJwtSecret}`)
      .replace(/AUTH_SECRET=.*/, `AUTH_SECRET=${newAuthSecret}`);

    fs.writeFileSync(envPath, updatedEnv);
    console.log('📝 Updated .env with new secrets');
  }

  console.log('✅ Secrets rotated successfully');
  return { newJwtSecret, newAuthSecret };
}

async function main() {
  try {
    await generateKeyPair();
    const result = rotateSecrets();

    // Optional: Upload new public key to version control if needed
    // Consider implementing key versioning strategy

  } catch (error) {
    console.error('[SECRET_ROTATION]', error);
    process.exit(1);
  }
}

main();
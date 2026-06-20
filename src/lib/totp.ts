import { randomBytes } from 'crypto';

/**
 * Generate a random secret for TOTP
 */
export function generateSecret(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate a TOTP code from a secret and counter
 */
export function generateTotp(secret: string, counter?: number): string {
  // Simple TOTP implementation using crypto
  // In production, use a library like 'speakeasy'
  const crypto = require('crypto');
  const time = Math.floor(Date.now() / 1000 / 30);
  const buffer = Buffer.alloc(8);
  
  for (let i = 7; i >= 0; i--) {
    buffer.writeUInt32BE(time >>> 0, i >= 4 ? 4 : 0);
  }
  
  const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
  hmac.update(buffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0xf;
  const code = ((hash[offset] & 0x7f) << 24 |
                (hash[offset + 1] & 0xff) << 16 |
                (hash[offset + 2] & 0xff) << 8 |
                (hash[offset + 3] & 0xff)) % 1000000;
  
  return code.toString().padStart(6, '0');
}

/**
 * Verify a TOTP code
 */
export function verifyTotp(secret: string, token: string, window: number = 1): boolean {
  const crypto = require('crypto');
  const time = Math.floor(Date.now() / 1000 / 30);
  
  for (let i = -window; i <= window; i++) {
    const counter = time + i;
    const buffer = Buffer.alloc(8);
    
    for (let j = 7; j >= 0; j--) {
      buffer.writeUInt32BE(counter >>> 0, j >= 4 ? 4 : 0);
    }
    
    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'hex'));
    hmac.update(buffer);
    const hash = hmac.digest();
    
    const offset = hash[hash.length - 1] & 0xf;
    const code = ((hash[offset] & 0x7f) << 24 |
                  (hash[offset + 1] & 0xff) << 16 |
                  (hash[offset + 2] & 0xff) << 8 |
                  (hash[offset + 3] & 0xff)) % 1000000;
    
    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }
  
  return false;
}

/**
 * Generate a QR code URL for TOTP setup
 */
export async function generateQRCode(secret: string, email: string, issuer: string = 'TaskPlanner'): Promise<string> {
  // Return a provisioning URI that can be used with QR code generators
  const encodedSecret = secret.toUpperCase().match(/.{1,4}/g)?.join(' ') || secret;
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${encodedSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

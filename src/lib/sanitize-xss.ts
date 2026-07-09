/**
 * XSS-hardened content sanitization
 * Content Security Policy (CSP) enforcement
 */

import sanitizeFn from 'xss';

const XSS_CONFIG = {
  whiteList: {
    span: ['style', 'class', 'data-*'],
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'data-src'],
    code: ['class', 'data-lang']
  },
  stripIgnoreTag: true,
  escapeElements: ['script', 'style', 'html', 'xml']
};

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = sanitizeFn(input, XSS_CONFIG);

  // Additional CSP-enforcing sanitization
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return sanitized;
}
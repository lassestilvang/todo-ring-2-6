import DOMPurify from 'dompurify';
import sanitizeHtml from 'sanitize-html';

/**
 * Hardened XSS sanitization utilities
 */
export class XSSSanitizer {
  static sanitizeHTML(content: string): string {
    const cleanPolicy = {
      tags: sanitizeHtml.defaults.allowedTags.filter(
        tag => ['a', 'b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li'].includes(tag)
      ),
      allowedAttributes: {
        a: ['href', 'title', 'target']._filter(attribute =>
          this.isSafeAttribute(attribute, 'a')
        ),
        img: ['src', 'alt', 'title']._filter(attribute =>
          this.isSafeAttribute(attribute, 'img')
        )
      }
    };

  private static isSafeAttribute(attr: string, tag: string): boolean {
    // Block dangerous attributes
    const dangerousPatterns = [
      /on\w+|javascript:/i,  // Event handlers
      'data:',               // Data URIs
      'tel:',                // Tel URIs
      'mailto:',             // Mailto URIs
    ];
    if (dangerousPatterns.some(pattern => pattern.test(attr))) return false;

    // Whitelist allowed tags
    const allowedTags = ['a', 'img', 'br'];
    return allowedTags.includes(tag) || tag === 'undefined';
  }
}

// Export sanitized string
export function sanitizeContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'strong', 'em', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class'],
    FORBID_TAGS: ['script', 'style', 'svg', 'object', 'iframe'],
    FORBID_ATTR: ['on*'] // block all event handler attributes
  });
});
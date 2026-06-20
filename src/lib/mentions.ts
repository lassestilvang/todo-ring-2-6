/**
 * Mention parsing and handling utilities
 */

/**
 * Parse @mentions from text content
 * Returns array of mentioned user IDs and cleaned content
 */
export function parseMentions(content: string): {
  mentionedUserIds: string[];
  cleanedContent: string;
  mentionPatterns: Array<{ pattern: string; userId?: string }>;
} {
  const mentionPatterns: Array<{ pattern: string; userId?: string }> = [];
  const mentionedUserIds: string[] = [];

  // Match @username patterns
  const mentionRegex = /@([\w.-]+)/g;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const username = match[1];
    // In a real app, you'd look up the user by username
    // For now, we just capture the pattern
    mentionPatterns.push({ pattern: `@${username}` });
  }

  // Clean content by removing @ symbols for display
  const cleanedContent = content.replace(/@([\w.-]+)/g, '<span class="mention">@$1</span>');

  return {
    mentionedUserIds,
    cleanedContent,
    mentionPatterns,
  };
}

import { getDb } from '@/db/index';

/**
 * Find users by username or email
 */
export function findUsers(query: string): Array<{ id: string; name: string; email: string }> {
  const db = getDb();
  const searchPattern = `%${query}%`;

  // This would typically search a users table
  // For now, return empty array
  return db.prepare(
    `SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 10`
  ).all(searchPattern, searchPattern) as Array<{ id: string; name: string; email: string }>;
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): { id: string; name: string; email: string } | null {
  const db = getDb();
  return db.prepare(
    'SELECT id, name, email FROM users WHERE id = ?'
  ).get(userId) as { id: string; name: string; email: string } | null;
}
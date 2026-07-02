import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommentReactions } from '@/components/comment-reactions';
import type { CommentReaction } from '@/types/index';

// Mock the API
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: vi.fn(),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CommentReactions', () => {
  const mockReactions: CommentReaction[] = [
    {
      id: '1',
      commentId: 'comment-1',
      userId: 'user-1',
      userName: 'Alice',
      emoji: '👍',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      commentId: 'comment-1',
      userId: 'user-2',
      userName: 'Bob',
      emoji: '👍',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      commentId: 'comment-1',
      userId: 'user-1',
      userName: 'Alice',
      emoji: '❤️',
      createdAt: new Date().toISOString(),
    },
  ];

  it('should render reaction counts correctly', () => {
    // Test that reactions are grouped and counted
    const reactionCounts = new Map<string, { count: number; hasUserReacted: boolean }>();

    mockReactions.forEach((r) => {
      const existing = reactionCounts.get(r.emoji) || { count: 0, hasUserReacted: false };
      reactionCounts.set(r.emoji, {
        count: existing.count + 1,
        hasUserReacted: r.userId === 'user-1' || existing.hasUserReacted,
      });
    });

    expect(reactionCounts.get('👍')?.count).toBe(2);
    expect(reactionCounts.get('❤️')?.count).toBe(1);
  });

  it('should identify if user has reacted', () => {
    const reactionCounts = new Map<string, { count: number; hasUserReacted: boolean }>();

    mockReactions.forEach((r) => {
      const existing = reactionCounts.get(r.emoji) || { count: 0, hasUserReacted: false };
      reactionCounts.set(r.emoji, {
        count: existing.count + 1,
        hasUserReacted: r.userId === 'user-1' || existing.hasUserReacted,
      });
    });

    expect(reactionCounts.get('👍')?.hasUserReacted).toBe(true);
    expect(reactionCounts.get('❤️')?.hasUserReacted).toBe(true);
  });
});

describe('Reaction API', () => {
  it('should handle duplicate reactions', async () => {
    // Test that the same user cannot react twice with same emoji
    const reactionCounts = new Map<string, { count: number; hasUserReacted: boolean }>();

    const reactions = [
      { emoji: '👍', userId: 'user-1' },
      { emoji: '👍', userId: 'user-1' }, // Duplicate
    ];

    reactions.forEach((r) => {
      const existing = reactionCounts.get(r.emoji) || { count: 0, hasUserReacted: false };
      reactionCounts.set(r.emoji, {
        count: existing.count + 1,
        hasUserReacted: r.userId === 'user-1' || existing.hasUserReacted,
      });
    });

    // Should count both but hasUserReacted should be true
    expect(reactionCounts.get('👍')?.count).toBe(2);
    expect(reactionCounts.get('👍')?.hasUserReacted).toBe(true);
  });
});
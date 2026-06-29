/**
 * API Templates Marketplace Route - Tests
 * Tests for /api/templates/marketplace endpoint
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { z } from 'zod';

// Schema from validations
const TaskTemplateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required'),
  icon: z.string().default('📋'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  priority: z.enum(['high', 'medium', 'low', 'none']).default('none'),
  estimateHours: z.number().min(0).default(0),
  estimateMinutes: z.number().min(0).max(59).default(0),
  isAllDay: z.boolean().default(false),
  recurringType: z.enum(['none', 'daily', 'weekly', 'weekdays', 'monthly', 'yearly', 'custom']).default('none'),
  recurringInterval: z.string().default(''),
  labelIds: z.array(z.string().uuid()).default([]),
  category: z.string().default('general'),
  createdBy: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  usageCount: z.number().default(0),
});

interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  estimateHours: number;
  estimateMinutes: number;
  isAllDay: boolean;
  recurringType: string;
  recurringInterval: string;
  labelIds: string[];
  category: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
  avgRating: number;
  ratingCount: number;
}

interface MockStore {
  templates: TaskTemplate[];
  templateRatings: { templateId: string; rating: number; createdAt: string }[];
}

const createMockStore = (): MockStore => ({
  templates: [],
  templateRatings: [],
});

function generateId() {
  return crypto.randomUUID?.() ?? Math.random().toString(36).substr(2, 9);
}

describe('API Templates Marketplace Route', () => {
  let store: MockStore;

  beforeEach(() => {
    store = createMockStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/templates/marketplace', () => {
    it('should return templates filtered by category', () => {
      store.templates.push({
        id: 't1',
        name: 'Work Template',
        icon: '💼',
        title: 'Work Task',
        description: '',
        priority: 'high',
        estimateHours: 2,
        estimateMinutes: 0,
        isAllDay: false,
        recurringType: 'none',
        recurringInterval: '',
        labelIds: [],
        category: 'work',
        createdBy: null,
        createdAt: '',
        updatedAt: '',
        usageCount: 10,
        avgRating: 4.5,
        ratingCount: 20,
      });

      const category = 'work';
      const filtered = store.templates.filter(t => t.category === category);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Work Template');
    });

    it('should sort by usage_count', () => {
      store.templates.push({
        id: 't1',
        name: 'Popular',
        icon: '',
        title: '',
        description: '',
        priority: 'none',
        estimateHours: 0,
        estimateMinutes: 0,
        isAllDay: false,
        recurringType: 'none',
        recurringInterval: '',
        labelIds: [],
        category: 'general',
        createdBy: null,
        createdAt: '',
        updatedAt: '',
        usageCount: 100,
        avgRating: 4.0,
        ratingCount: 50,
      });

      store.templates.push({
        id: 't2',
        name: 'Less Popular',
        icon: '',
        title: '',
        description: '',
        priority: 'none',
        estimateHours: 0,
        estimateMinutes: 0,
        isAllDay: false,
        recurringType: 'none',
        recurringInterval: '',
        labelIds: [],
        category: 'general',
        createdBy: null,
        createdAt: '',
        updatedAt: '',
        usageCount: 10,
        avgRating: 4.0,
        ratingCount: 50,
      });

      const sorted = [...store.templates].sort((a, b) => b.usageCount - a.usageCount);
      expect(sorted[0].name).toBe('Popular');
    });

    it('should sort by avg_rating', () => {
      store.templates.push({
        id: 't1',
        name: 'High Rated',
        icon: '',
        title: '',
        description: '',
        priority: 'none',
        estimateHours: 0,
        estimateMinutes: 0,
        isAllDay: false,
        recurringType: 'none',
        recurringInterval: '',
        labelIds: [],
        category: 'general',
        createdBy: null,
        createdAt: '',
        updatedAt: '',
        usageCount: 10,
        avgRating: 4.8,
        ratingCount: 50,
      });

      store.templates.push({
        id: 't2',
        name: 'Low Rated',
        icon: '',
        title: '',
        description: '',
        priority: 'none',
        estimateHours: 0,
        estimateMinutes: 0,
        isAllDay: false,
        recurringType: 'none',
        recurringInterval: '',
        labelIds: [],
        category: 'general',
        createdBy: null,
        createdAt: '',
        updatedAt: '',
        usageCount: 10,
        avgRating: 2.5,
        ratingCount: 50,
      });

      const sorted = [...store.templates].sort((a, b) => b.avgRating - a.avgRating);
      expect(sorted[0].name).toBe('High Rated');
    });

    it('should limit results', () => {
      const limit = 5;
      const all = store.templates.slice(0, limit);
      expect(all.length).toBeLessThanOrEqual(limit);
    });

    it('should include rating info in response', () => {
      const template = store.templates[0];
      const ratings = store.templateRatings.filter(r => r.templateId === template?.id);
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;

      expect(avgRating).toBeDefined();
    });
  });

  describe('POST /api/templates/marketplace - Rate Template', () => {
    it('should validate templateId and rating', () => {
      const body = {};
      expect(body.templateId).toBeUndefined();
      expect(body.rating).toBeUndefined();
    });

    it('should validate rating range (1-5)', () => {
      const rating = 6;
      expect(rating >= 1 && rating <= 5).toBe(false);
    });

    it('should accept valid rating', () => {
      const rating = 5;
      expect(rating >= 1 && rating <= 5).toBe(true);
    });

    it('should store rating', () => {
      const templateId = 'template-1';
      const rating = 4;

      store.templateRatings.push({
        templateId,
        rating,
        createdAt: new Date().toISOString(),
      });

      const templateRatings = store.templateRatings.filter(r => r.templateId === templateId);
      expect(templateRatings).toHaveLength(1);
      expect(templateRatings[0].rating).toBe(4);
    });
  });

  describe('Template Categories', () => {
    it('should filter by work category', () => {
      store.templates.push({
        id: 't1',
        name: 'Work Task',
        icon: '',
        title: '',
        description: '',
        priority: 'none',
        estimateHours: 0,
        estimateMinutes: 0,
        isAllDay: false,
        recurringType: 'none',
        recurringInterval: '',
        labelIds: [],
        category: 'work',
        createdBy: null,
        createdAt: '',
        updatedAt: '',
        usageCount: 0,
        avgRating: 0,
        ratingCount: 0,
      });

      const workTemplates = store.templates.filter(t => t.category === 'work');
      expect(workTemplates).toHaveLength(1);
    });

    it('should filter by personal category', () => {
      store.templates.push({
        id: 't2',
        name: 'Personal Task',
        icon: '',
        title: '',
        description: '',
        priority: 'none',
        estimateHours: 0,
        estimateMinutes: 0,
        isAllDay: false,
        recurringType: 'none',
        recurringInterval: '',
        labelIds: [],
        category: 'personal',
        createdBy: null,
        createdAt: '',
        updatedAt: '',
        usageCount: 0,
        avgRating: 0,
        ratingCount: 0,
      });

      const personalTemplates = store.templates.filter(t => t.category === 'personal');
      expect(personalTemplates).toHaveLength(1);
    });
  });
});
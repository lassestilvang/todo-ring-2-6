import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_THEMES,
  getStoredTheme,
  saveTheme,
  applyTheme,
  getThemeStyles,
} from '../../src/lib/themes';

describe('Theme Utilities', () => {
  describe('DEFAULT_THEMES', () => {
    it('should have default themes defined', () => {
      expect(DEFAULT_THEMES.length).toBeGreaterThan(0);
    });

    it('should have required theme properties', () => {
      DEFAULT_THEMES.forEach(theme => {
        expect(theme.id).toBeDefined();
        expect(theme.name).toBeDefined();
        expect(theme.emoji).toBeDefined();
        expect(theme.colors.primary).toBeDefined();
        expect(theme.colors.background).toBeDefined();
      });
    });

    it('should have a default theme', () => {
      const defaultTheme = DEFAULT_THEMES.find(t => t.id === 'default');
      expect(defaultTheme).toBeDefined();
    });

    it('should have a dark theme', () => {
      const darkTheme = DEFAULT_THEMES.find(t => t.id === 'dark');
      expect(darkTheme).toBeDefined();
    });
  });

  describe('getStoredTheme', () => {
    it('should return default theme when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(getStoredTheme()).toBe('default');
      global.window = originalWindow;
    });

    it('should return stored theme from localStorage', () => {
      const mockStorage: Record<string, string> = {};
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: (key: string) => mockStorage[key] || null,
          setItem: (key: string, value: string) => { mockStorage[key] = value; },
        },
        writable: true,
        configurable: true,
      });

      // Set a stored theme BEFORE calling getStoredTheme
      mockStorage['taskplanner-theme'] = 'dark';
      const result = getStoredTheme();
      expect(result).toBe('dark');
    });

    it('should return default when localStorage returns null', () => {
      const mockStorage: Record<string, string | null> = {};
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: (key: string) => mockStorage[key] || null,
          setItem: (key: string, value: string) => { mockStorage[key] = value; },
        },
        writable: true,
        configurable: true,
      });

      expect(getStoredTheme()).toBe('default');
    });
  });

  describe('saveTheme', () => {
    it('should not throw when window is undefined', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      expect(() => saveTheme('dark')).not.toThrow();
      global.window = originalWindow;
    });

    it('should save theme to localStorage', () => {
      const mockStorage: Record<string, string> = {};
      Object.defineProperty(global, 'localStorage', {
        value: {
          getItem: (key: string) => mockStorage[key] || null,
          setItem: (key: string, value: string) => { mockStorage[key] = value; },
        },
        writable: true,
        configurable: true,
      });

      // Set window to make localStorage available
      global.window = {};
      saveTheme('forest');
      // Check the mockStorage directly
      expect(mockStorage['taskplanner-theme']).toBe('forest');
    });
  });

  describe('applyTheme', () => {
    it('should not throw when document is undefined', () => {
      const originalDocument = global.document;
      // @ts-ignore
      delete global.document;
      expect(() => applyTheme(DEFAULT_THEMES[0])).not.toThrow();
      global.document = originalDocument;
    });

    it('should apply theme CSS variables', () => {
      const mockSetProperty = vi.fn();
      const mockRoot = {
        style: {
          setProperty: mockSetProperty,
        },
      };
      Object.defineProperty(global, 'document', {
        value: {
          documentElement: mockRoot,
        },
        writable: true,
      });

      const theme = DEFAULT_THEMES[0];
      applyTheme(theme);

      expect(mockSetProperty).toHaveBeenCalledWith('--primary', theme.colors.primary);
      expect(mockSetProperty).toHaveBeenCalledWith('--background', theme.colors.background);
    });
  });

  describe('getThemeStyles', () => {
    it('should return CSS variables from theme', () => {
      const theme = DEFAULT_THEMES[0];
      const styles = getThemeStyles(theme);

      expect(styles['--primary']).toBe(theme.colors.primary);
      expect(styles['--background']).toBe(theme.colors.background);
      expect(styles['--text']).toBe(theme.colors.text);
    });

    it('should include all required CSS variables', () => {
      const theme = DEFAULT_THEMES[0];
      const styles = getThemeStyles(theme);

      expect(styles).toHaveProperty('--primary');
      expect(styles).toHaveProperty('--secondary');
      expect(styles).toHaveProperty('--accent');
      expect(styles).toHaveProperty('--background');
      expect(styles).toHaveProperty('--card');
      expect(styles).toHaveProperty('--text');
      expect(styles).toHaveProperty('--muted');
      expect(styles).toHaveProperty('--border');
    });
  });
});
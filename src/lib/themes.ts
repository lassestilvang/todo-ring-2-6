// Theme configuration types
export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
    muted: string;
    border: string;
  };
  emoji: string;
}

// Default themes
export const DEFAULT_THEMES: Theme[] = [
  {
    id: 'default',
    name: 'Default',
    emoji: '🌙',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#06b6d4',
      background: '#ffffff',
      card: '#ffffff',
      text: '#1f2937',
      muted: '#6b7280',
      border: '#e5e7eb',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    emoji: '🌑',
    colors: {
      primary: '#60a5fa',
      secondary: '#a78bfa',
      accent: '#2dd4bf',
      background: '#111827',
      card: '#1f2937',
      text: '#f9fafb',
      muted: '#9ca3af',
      border: '#374151',
    },
  },
  {
    id: 'forest',
    name: 'Forest',
    emoji: '🌲',
    colors: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#14b8a6',
      background: '#f0fdf4',
      card: '#ffffff',
      text: '#1f2937',
      muted: '#6b7280',
      border: '#dcfce7',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    emoji: '🌅',
    colors: {
      primary: '#f97316',
      secondary: '#ea580c',
      accent: '#fbbf24',
      background: '#fff7ed',
      card: '#ffffff',
      text: '#1f2937',
      muted: '#6b7280',
      border: '#ffedd5',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    emoji: '🌊',
    colors: {
      primary: '#0ea5e9',
      secondary: '#0284c7',
      accent: '#38bdf8',
      background: '#f0f9ff',
      card: '#ffffff',
      text: '#1f2937',
      muted: '#6b7280',
      border: '#cff8ed',
    },
  },
];

// Get stored theme from localStorage
export function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'default';
  return localStorage.getItem('taskplanner-theme') || 'default';
}

// Save theme to localStorage
export function saveTheme(themeId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('taskplanner-theme', themeId);
}

// Apply theme colors to document
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--secondary', theme.colors.secondary);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--background', theme.colors.background);
  root.style.setProperty('--card', theme.colors.card);
  root.style.setProperty('--text', theme.colors.text);
  root.style.setProperty('--muted', theme.colors.muted);
  root.style.setProperty('--border', theme.colors.border);
}

// Generate CSS variables from theme
export function getThemeStyles(theme: Theme): Record<string, string> {
  return {
    '--primary': theme.colors.primary,
    '--secondary': theme.colors.secondary,
    '--accent': theme.colors.accent,
    '--background': theme.colors.background,
    '--card': theme.colors.card,
    '--text': theme.colors.text,
    '--muted': theme.colors.muted,
    '--border': theme.colors.border,
  };
}
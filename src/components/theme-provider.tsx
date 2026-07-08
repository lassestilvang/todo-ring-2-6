'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type ThemeProviderProps = React.ComponentPropsWithoutRef<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Respect prefers-reduced-motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion)').matches;

  return (
    <NextThemesProvider
      {...props}
      disableTransitionOnChange={prefersReducedMotion}
    >
      {children}
    </NextThemesProvider>
  );
}

/**
 * Check for accessibility preferences
 */
export function getAccessibilityPreferences() {
  if (typeof window === 'undefined') return {};

  return {
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion)').matches,
    prefersHighContrast: window.matchMedia('(prefers-contrast: high)').matches,
    prefersLowContrast: window.matchMedia('(prefers-contrast: low)').matches,
  };
}

/**
 * WCAG-compliant color contrast checker
 */
export function checkContrast(foreground: string, background: string): number {
  // Convert hex to RGB
  const fgRgb = hexToRgb(foreground);
  const bgRgb = hexToRgb(background);

  if (!fgRgb || !bgRgb) return 0;

  // Calculate relative luminance
  const fgLum = getRelativeLuminance(fgRgb);
  const bgLum = getRelativeLuminance(bgRgb);

  // Calculate contrast ratio
  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);

  return (lighter + 0.05) / (darker + 0.05);
}

function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

function getRelativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}
import { useEffect, useRef } from 'react';

/**
 * Accessibility hook for keyboard navigation and focus management
 */
export function useFocusTrap(isActive: boolean = false) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}

/**
 * ARIA live region hook for error announcements
 */
export function useLiveRegion() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const region = document.getElementById('aria-live-region');
    if (!region) return;

    region.setAttribute('aria-live', priority);
    region.textContent = message;
  };

  return { announce };
}

/**
 * Skip link component for keyboard users
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
    >
      Skip to main content
    </a>
  );
}
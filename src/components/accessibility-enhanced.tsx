'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { Moon, Sun, Type, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Skip to content link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
    >
      Skip to main content
    </a>
  );
}

// ARIA live region for announcements
export function AriaLiveRegion({ message, type = 'polite' }: { message: string; type?: 'polite' | 'assertive' }) {
  return (
    <div
      aria-live={type}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Focus trap hook for modals
export function useFocusTrap(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return;

    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    firstElement?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);
}

// Keyboard shortcut helper
export function useKeyboardShortcut(
  key: string,
  callback: (e: KeyboardEvent) => void,
  options?: { shift?: boolean; ctrl?: boolean; meta?: boolean }
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMatch =
        e.key === key &&
        !!options?.shift === e.shiftKey &&
        !!options?.ctrl === e.ctrlKey &&
        !!options?.meta === e.metaKey;

      if (isMatch) {
        e.preventDefault();
        callback(e);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [key, callback, options]);
}

// Accessible icon button
interface AccessibleIconButtonProps {
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
}

export function AccessibleIconButton({
  icon: Icon,
  label,
  onClick,
  className,
  variant = 'ghost',
}: AccessibleIconButtonProps) {
  return (
    <Button
      variant={variant}
      size="sm"
      onClick={onClick}
      className={cn('h-8 w-8 p-2', className)}
      aria-label={label}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </Button>
  );
}

// Accessible dialog
interface AccessibleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  description?: string;
}

export function AccessibleDialog({
  open,
  onOpenChange,
  title,
  children,
  description,
}: AccessibleDialogProps) {
  useFocusTrap(open);

  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      <DialogOverlay />
      <DialogContent className="max-w-lg" description={description}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </DialogRoot>
  );
}

// Dialog primitives (simplified for this example)
const DialogRoot = ({ open, onOpenChange, children }: any) => (
  <div
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    className={cn(
      "fixed inset-0 z-50 flex items-center justify-center",
      open ? "pointer-events-auto" : "pointer-events-none"
    )}
    onClick={() => onOpenChange(false)}
  >
    {children}
  </div>
);

const DialogOverlay = () => (
  <div
    className="absolute inset-0 bg-background/80 backdrop-blur-sm"
    onClick={(e) => e.stopPropagation()}
  />
);

const DialogContent = memo(({ children, className, description }: any) => (
  <div
    className={cn(
      "relative z-50 bg-card border rounded-lg shadow-xl max-h-[90vh] overflow-y-auto",
      className
    )}
    onClick={(e) => e.stopPropagation()}
    role="document"
    aria-description={description}
  >
    {children}
  </div>
));

const DialogHeader = memo(({ children }: { children: React.ReactNode }) => (
  <div className="p-6 pb-4">
    {children}
  </div>
));

const DialogTitle = memo(({ children }: { children: React.ReactNode }) => (
  <h2 id="dialog-title" className="text-lg font-semibold">{children}</h2>
));

const DialogDescription = memo(({ children }: { children: React.ReactNode }) => (
  <p id="dialog-description" className="text-sm text-muted-foreground mt-1">
    {children}
  </p>
));

const memo = React.memo;

// Theme toggle with accessibility
export function AccessibleThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  );
}

// Text size adjuster
export function TextSizeAdjuster() {
  const [size, setSize] = useState<'normal' | 'large' | 'x-large'>('normal');

  useEffect(() => {
    const savedSize = localStorage.getItem('textSize') as 'normal' | 'large' | 'x-large' | null;
    if (savedSize) setSize(savedSize);
  }, []);

  const updateSize = (newSize: 'normal' | 'large' | 'x-large') => {
    setSize(newSize);
    localStorage.setItem('textSize', newSize);
    document.documentElement.style.fontSize = {
      normal: '100%',
      large: '125%',
      'x-large': '150%',
    }[newSize];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Adjust text size">
          <Type className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => updateSize('normal')}>
          Normal
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateSize('large')}>
          Large
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => updateSize('x-large')}>
          Extra Large
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
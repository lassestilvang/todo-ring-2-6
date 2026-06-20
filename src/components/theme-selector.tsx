'use client';

import * as React from 'react';
import { Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { DEFAULT_THEMES, getStoredTheme, saveTheme, applyTheme } from '@/lib/themes';

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = React.useState<string>('default');

  React.useEffect(() => {
    const stored = getStoredTheme();
    setCurrentTheme(stored);
    const theme = DEFAULT_THEMES.find(t => t.id === stored) || DEFAULT_THEMES[0];
    if (theme) {
      applyTheme(theme);
    }
  }, []);

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    saveTheme(themeId);
    const theme = DEFAULT_THEMES.find(t => t.id === themeId) || DEFAULT_THEMES[0];
    if (theme) {
      applyTheme(theme);
    }
  };

  const currentThemeData = DEFAULT_THEMES.find(t => t.id === currentTheme) || DEFAULT_THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <span className="mr-2 text-base">{currentThemeData?.emoji || '🌙'}</span>
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card/95 backdrop-blur-xl border shadow-lg max-h-80 overflow-y-auto">
        {DEFAULT_THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className="cursor-pointer p-3 rounded-lg mb-1 last:mb-0 focus:bg-accent"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{theme.emoji}</span>
              <div className="flex-1">
                <p className="font-medium text-sm">{theme.name}</p>
                <div className="flex items-center gap-1 mt-1">
                  {Object.values(theme.colors).slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border-2 border-background"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              {currentTheme === theme.id && (
                <Check className="w-4 h-4 text-primary ml-auto" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
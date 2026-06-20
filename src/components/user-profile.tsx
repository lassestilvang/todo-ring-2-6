'use client';

import * as React from 'react';
import { User, LogOut, Settings, Users, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';

export function UserProfile() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (!user) {
    return (
      <div className="p-3 rounded-xl bg-muted/50 mb-4">
        <p className="text-xs text-muted-foreground mb-2">Not signed in</p>
        <Button size="sm" onClick={() => window.location.href = '/auth'} className="w-full">
          <User className="w-3 h-3 mr-1" />
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start h-auto p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar || ''} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm">{user.name}</p>
              <p className="text-[11px] text-muted-foreground/60">{user.email}</p>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <div className="mr-2 h-4 w-4">
            <div className="relative">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute top-0 h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            </div>
          </div>
          Toggle Theme
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CollaborationIndicator() {
  const [isCollaborating, setIsCollaborating] = React.useState(false);

  React.useEffect(() => {
    // Check if there are any shared tasks/lists
    const checkCollaboration = async () => {
      try {
        const res = await fetch('/api/sharing');
        if (res.ok) {
          const json = await res.json();
          setIsCollaborating(json.data && json.data.length > 0);
        }
      } catch {
        setIsCollaborating(false);
      }
    };
    checkCollaboration();
  }, []);

  if (!isCollaborating) return null;

  return (
    <div className="fixed bottom-20 right-6 z-40 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5 shadow-lg">
      <div className="flex items-center gap-2 text-xs">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="font-medium text-green-600">Team Mode Active</span>
        <Users className="w-3 h-3 text-green-500" />
      </div>
    </div>
  );
}
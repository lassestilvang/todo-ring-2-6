'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Menu, X, Inbox, Calendar, Clock, ListTodo, Tag, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from '@/hooks/use-sidebar';
import { useTaskStore } from '@/hooks/use-task-store';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const VIEWS = [
  { id: 'today', name: 'Today', icon: Calendar, shortcut: 'T' },
  { id: 'next7', name: 'Next 7 Days', icon: Clock, shortcut: '7' },
  { id: 'upcoming', name: 'Upcoming', icon: Calendar, shortcut: 'U' },
  { id: 'all', name: 'All Tasks', icon: ListTodo, shortcut: 'A' },
];

export default function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const { 
    lists, 
    labels, 
    activeView, 
    setActiveView, 
    activeList, 
    setActiveList,
    searchQuery,
    setSearchQuery,
  } = useTaskStore();

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        initial={false}
        animate={{ width: 256 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <Inbox className="w-6 h-6 text-brand-600" />
            <span className="text-lg font-bold text-sidebar-foreground">TaskPlanner</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggle} className="lg:hidden">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 py-2">
            {/* Views */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Views
              </h4>
              <nav className="space-y-1">
                {VIEWS.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      setActiveView(view.id);
                      setActiveList(null);
                      if (window.innerWidth < 1024) toggle();
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors',
                      activeView === view.id
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <view.icon className="w-4 h-4" />
                    <span>{view.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <Separator className="mb-4" />

            {/* Lists */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2 px-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Lists
                </h4>
                <Button variant="ghost" size="icon" className="w-5 h-5">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <nav className="space-y-1">
                {lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => {
                      setActiveList(list.id);
                      setActiveView('list');
                      if (window.innerWidth < 1024) toggle();
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors',
                      activeList === list.id && activeView === 'list'
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    )}
                  >
                    <span className="text-lg">{list.emoji}</span>
                    <span className="flex-1 text-left truncate">{list.name}</span>
                    {list.isInbox && (
                      <Badge variant="secondary" className="text-[10px]">Inbox</Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <Separator className="mb-4" />

            {/* Labels */}
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Labels
                </h4>
                <Button variant="ghost" size="icon" className="w-5 h-5">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <nav className="space-y-1">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-accent/50"
                  >
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1 text-left truncate">{label.name}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </motion.aside>
    </>
  );
}
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Inbox, Calendar, Clock, ListTodo, X, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSidebar } from '@/hooks/use-sidebar';
import { useTaskStore } from '@/hooks/use-task-store';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ThemeSelector } from '@/components/theme-selector';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ListCreateDialog } from '@/components/list-create-dialog';
import { LabelCreateDialog } from '@/components/label-create-dialog';
import { UserProfile } from '@/components/user-profile';
import type { List, Label } from '@/types/index';

const VIEWS = [
  { id: 'today', name: 'Today', icon: Calendar, shortcut: 'T' },
  { id: 'next7', name: 'Next 7 Days', icon: Clock, shortcut: '7' },
  { id: 'upcoming', name: 'Upcoming', icon: Calendar, shortcut: 'U' },
  { id: 'all', name: 'All Tasks', icon: ListTodo, shortcut: 'A' },
];

const SPECIAL_VIEWS = [
  { id: 'analytics', name: 'Analytics', icon: BarChart3, shortcut: 'G' },
];

async function fetchLists() {
  const res = await fetch('/api/lists');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch lists');
  return json.data;
}

async function fetchLabels() {
  const res = await fetch('/api/labels');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch labels');
  return json.data;
}

export default function Sidebar() {
  const { isOpen, toggle } = useSidebar();
  const [isListDialogOpen, setIsListDialogOpen] = React.useState(false);
  const [isLabelDialogOpen, setIsLabelDialogOpen] = React.useState(false);
  const {
    activeView,
    setActiveView,
    activeList,
    setActiveList,
    activeLabel,
    setActiveLabel,
    searchQuery,
    setSearchQuery,
  } = useTaskStore();

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
  });

  const { data: labels = [] } = useQuery({
    queryKey: ['labels'],
    queryFn: fetchLabels,
  });

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggle}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 w-64 bg-sidebar-background/80 backdrop-blur-xl border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        initial={false}
        animate={{ width: 256 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Inbox className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-sidebar-foreground">TaskPlanner</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggle} className="lg:hidden rounded-full">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 py-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-sidebar-accent/30 border-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all h-10 rounded-xl"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-3">
          <div className="py-2 space-y-6">
            {/* Views */}
            <div>
              <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-3 px-3">
                Main
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
                      'w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 group',
                      activeView === view.id
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <view.icon className={cn(
                      "w-4 h-4 transition-transform group-hover:scale-110",
                      activeView === view.id ? "text-primary-foreground" : "text-brand-500"
                    )} />
                    <span className="flex-1 text-left">{view.name}</span>
                    {view.shortcut && (
                      <kbd className={cn(
                        "hidden group-hover:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                        activeView === view.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                      )}>
                        {view.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Special Views */}
            <div>
              <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] mb-3 px-3">
                Insights
              </h4>
              <nav className="space-y-1">
                {SPECIAL_VIEWS.map((view) => (
                  <button
                    key={view.id}
                    onClick={() => {
                      window.location.href = '/analytics';
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 group',
                      'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                    )}
                  >
                    <view.icon className="w-4 h-4 text-brand-500" />
                    <span className="flex-1 text-left">{view.name}</span>
                    {view.shortcut && (
                      <kbd className="hidden group-hover:inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase bg-muted/50 text-muted-foreground">
                        {view.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Lists */}
            <div>
              <div className="flex items-center justify-between mb-3 px-3">
                <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                  Lists
                </h4>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsListDialogOpen(true)}
                  className="w-5 h-5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <nav className="space-y-1">
                {lists.map((list: List) => (
                  <button
                    key={list.id}
                    onClick={() => {
                      setActiveList(list.id);
                      setActiveView('list');
                      if (window.innerWidth < 1024) toggle();
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 group',
                      activeList === list.id && activeView === 'list'
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-sm'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground'
                    )}
                  >
                    <span className="text-base group-hover:scale-125 transition-transform duration-300">{list.emoji}</span>
                    <span className="flex-1 text-left truncate">{list.name}</span>
                    {list.isInbox && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50">Inbox</Badge>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Labels */}
            <div>
              <div className="flex items-center justify-between mb-3 px-3">
                <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                  Labels
                </h4>
                <Button variant="ghost" size="icon" onClick={() => setIsLabelDialogOpen(true)} className="w-5 h-5 rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <nav className="space-y-1">
                {labels.map((label: Label) => (
                  <button
                    key={label.id}
                    onClick={() => {
                      setActiveLabel(label.id);
                      setActiveView('label');
                      setActiveList(null);
                      if (window.innerWidth < 1024) toggle();
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium rounded-xl transition-all duration-200 group",
                      activeLabel === label.id && activeView === 'label'
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-border shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                    )}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-transparent group-hover:ring-primary/20 transition-all"
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
        <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Today</span>
              <span className="text-xs font-semibold text-sidebar-foreground">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSelector />
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const res = await fetch('/api/export');
                const json = await res.json();
                if (json.success) {
                  const data = JSON.stringify(json.data, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `tasks-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest hover:text-primary transition-colors"
              title="Export data"
            >
              Export
            </button>
            <span className="text-muted-foreground/30">|</span>
            <label
              className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
              title="Import data"
            >
              Import
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  try {
                    const data = JSON.parse(text);
                    await fetch('/api/import', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });
                    window.location.reload();
                  } catch (err) {
                    toast.error('Invalid file format');
                  }
                }}
              />
            </label>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-sidebar-border/50">
          <UserProfile />
        </div>
      </motion.aside>

      <ListCreateDialog
        open={isListDialogOpen}
        onOpenChange={setIsListDialogOpen}
      />
      <LabelCreateDialog
        open={isLabelDialogOpen}
        onOpenChange={setIsLabelDialogOpen}
      />
    </>
  );
}

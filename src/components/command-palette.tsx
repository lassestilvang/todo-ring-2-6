'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, Clock, ListTodo, Sparkles, Plus, Command as CommandIcon } from 'lucide-react';
import { useTaskStore } from '@/hooks/use-task-store';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

async function fetchLists() {
  const res = await fetch('/api/lists');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch lists');
  return json.data;
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { setActiveView, setActiveList } = useTaskStore();

  const { data: lists = [] } = useQuery({
    queryKey: ['lists'],
    queryFn: fetchLists,
    enabled: open,
  });

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const run = (callback: () => void) => {
    setOpen(false);
    setSearch('');
    callback();
  };

  return (
    <>
      {/* Trigger button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-2xl bg-primary text-primary-foreground px-5 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all"
      >
        <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
          <CommandIcon className="w-3 h-3" />
        </div>
        <span className="text-sm font-black uppercase tracking-widest hidden sm:inline">Actions</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter">
          ⌘⇧K
        </kbd>
      </motion.button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative w-full max-w-xl mx-4"
            >
              <div className="rounded-2xl border border-white/20 bg-card/80 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.4)] overflow-hidden">
                <Command className="w-full" label="Command Menu">
                  <div className="flex items-center border-b border-white/10 px-6">
                    <Search className="w-5 h-5 mr-3 text-muted-foreground shrink-0" />
                    <Command.Input
                      ref={inputRef}
                      value={search}
                      onValueChange={setSearch}
                      placeholder="What are you looking for?"
                      className="flex h-16 w-full bg-transparent py-4 text-base font-medium outline-none placeholder:text-muted-foreground/40"
                    />
                    <kbd className="hidden sm:inline-flex items-center rounded-md bg-muted/50 px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase">
                      ESC
                    </kbd>
                  </div>

                  <Command.List className="max-h-[400px] overflow-y-auto p-3 scrollbar-none">
                    <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                      <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                        <Search className="w-6 h-6 opacity-20" />
                      </div>
                      No results found for "{search}"
                    </Command.Empty>

                    <Command.Group heading="Navigation" className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                      {[
                        { id: 'today', label: 'Today', icon: Sparkles },
                        { id: 'next7', label: 'Next 7 Days', icon: Clock },
                        { id: 'upcoming', label: 'Upcoming', icon: Calendar },
                        { id: 'all', label: 'All Tasks', icon: ListTodo },
                      ].map((view) => (
                        <Command.Item
                          key={view.id}
                          onSelect={() => run(() => { setActiveView(view.id); setActiveList(null); })}
                          className="flex items-center gap-3 px-3 py-3 text-[13px] font-bold rounded-xl cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground group transition-all"
                        >
                          <view.icon className="w-4 h-4 text-brand-500 group-aria-selected:text-primary-foreground" />
                          {view.label}
                        </Command.Item>
                      ))}
                    </Command.Group>

                    {lists.length > 0 && (
                      <Command.Group heading="Lists" className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-4">
                        {lists.map((list: any) => (
                          <Command.Item
                            key={list.id}
                            onSelect={() => run(() => { setActiveView('list'); setActiveList(list.id); })}
                            className="flex items-center gap-3 px-3 py-3 text-[13px] font-bold rounded-xl cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground group transition-all"
                          >
                            <span className="text-base">{list.emoji}</span>
                            {list.name}
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}

                    <Command.Group heading="Actions" className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mt-4">
                      <Command.Item
                        onSelect={() => run(() => {
                          document.querySelector<HTMLInputElement>('input[placeholder*="What needs to be done"]')?.focus();
                        })}
                        className="flex items-center gap-3 px-3 py-3 text-[13px] font-bold rounded-xl cursor-pointer aria-selected:bg-primary aria-selected:text-primary-foreground group transition-all"
                      >
                        <div className="w-4 h-4 rounded-full bg-brand-500/10 flex items-center justify-center group-aria-selected:bg-white/20">
                          <Plus className="w-3 h-3 text-brand-500 group-aria-selected:text-primary-foreground" />
                        </div>
                        Create New Task
                      </Command.Item>
                    </Command.Group>
                  </Command.List>

                  <div className="p-4 border-t border-white/10 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <kbd className="bg-muted px-1.5 py-0.5 rounded border">↑↓</kbd> Navigate
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                        <kbd className="bg-muted px-1.5 py-0.5 rounded border">ENTER</kbd> Select
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-brand-500">
                      TaskPlanner Pro
                    </div>
                  </div>
                </Command>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

'use client';

import * as React from 'react';
import { Command } from 'cmdk';
import { Search, Calendar, Clock, ListTodo, Sparkles, Plus } from 'lucide-react';
import { useTaskStore } from '@/hooks/use-task-store';

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { setActiveView, setActiveList, lists } = useTaskStore();

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
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const run = (callback: () => void) => {
    setOpen(false);
    setSearch('');
    callback();
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-2.5 shadow-lg hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      >
        <Search className="w-4 h-4" />
        <span className="text-sm font-medium hidden sm:inline">Quick Actions</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-medium">
          ⌘⇧K
        </kbd>
      </button>

      {/* Dialog overlay */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
              <Command className="w-full" label="Command Menu">
                <div className="flex items-center border-b px-3">
                  <Search className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                  <Command.Input
                    ref={inputRef}
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search views, lists, or type a command..."
                    className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"

                <Command.List className="max-h-[300px] overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                    No results found.
                  </Command.Empty>

                  <Command.Group heading="Views">
                    <Command.Item onSelect={() => run(() => { setActiveView('today'); setActiveList(null); })}
                      className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent">
                      <Sparkles className="w-4 h-4 text-brand-500" /> Today
                    </Command.Item>
                    <Command.Item onSelect={() => run(() => { setActiveView('next7'); setActiveList(null); })}
                      className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent">
                      <Clock className="w-4 h-4 text-brand-500" /> Next 7 Days
                    </Command.Item>
                    <Command.Item onSelect={() => run(() => { setActiveView('upcoming'); setActiveList(null); })}
                      className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent">
                      <Calendar className="w-4 h-4 text-brand-500" /> Upcoming
                    </Command.Item>
                    <Command.Item onSelect={() => run(() => { setActiveView('all'); setActiveList(null); })}
                      className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent">
                      <ListTodo className="w-4 h-4 text-brand-500" /> All Tasks
                    </Command.Item>
                  </Command.Group>

                  {lists.length > 0 && (
                    <Command.Group heading="Lists">
                      {lists.map((list: any) => (
                        <Command.Item key={list.id}
                          onSelect={() => run(() => { setActiveView('list'); setActiveList(list.id); })}
                          className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent">
                          <span className="text-base">{list.emoji}</span> {list.name}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  <Command.Group heading="Actions">
                    <Command.Item onSelect={() => run(() => {
                      document.querySelector<HTMLInputElement>('input[placeholder*="Add a task"]')?.focus();
                    })}
                      className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer aria-selected:bg-accent">
                      <Plus className="w-4 h-4" /> Add a new task
                    </Command.Item>
                  </Command.Group>
                </Command.List>
              </Command>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
                  />
                </div>

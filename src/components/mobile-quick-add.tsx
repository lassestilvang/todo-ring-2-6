'use client';

import * as React from 'react';
import { Plus, X, Calendar, Tag, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { parseNaturalLanguage } from '@/lib/nlp';
import { cn } from '@/lib/utils';

interface MobileQuickAddProps {
  onAdd: (task: { title: string; date?: string | null; priority?: string }) => void;
  className?: string;
}

export function MobileQuickAdd({ onAdd, className }: MobileQuickAddProps) {
  const [title, setTitle] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedPriority, setSelectedPriority] = React.useState<'high' | 'medium' | 'low' | 'none'>('none');
  const [selectedDate, setSelectedDate] = React.useState<string | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsed = parseNaturalLanguage(title);

    onAdd({
      title: parsed.title || title,
      date: selectedDate || parsed.date || null,
      priority: selectedPriority === 'none' ? parsed.priority || 'none' : selectedPriority,
    });

    setTitle('');
    setSelectedPriority('none');
    setSelectedDate('');
    setIsOpen(false);
  };

  const priorityOptions = [
    { value: 'none', label: 'No Priority', color: 'text-muted-foreground' },
    { value: 'high', label: 'High', color: 'text-red-500' },
    { value: 'medium', label: 'Medium', color: 'text-amber-500' },
    { value: 'low', label: 'Low', color: 'text-blue-500' },
  ];

  return (
    <div className={cn("md:hidden", className)}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="w-full rounded-xl h-14 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold shadow-lg shadow-brand-500/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            <Plus className="w-5 h-5 mr-2" />
            What needs to be done?
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100%-2rem)] max-w-sm mx-auto p-0 shadow-xl rounded-2xl border" align="center">
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">New Task</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                className="text-base h-12 rounded-xl"
                autoFocus
              />

              <div className="grid grid-cols-2 gap-3">
                <Select value={selectedPriority} onValueChange={(v) => setSelectedPriority(v as any)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <Flag className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={opt.color}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDate ?? ''} onValueChange={setSelectedDate}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Due date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No date</SelectItem>
                    <SelectItem value={new Date().toISOString().split('T')[0]}>Today</SelectItem>
                    <SelectItem value={new Date(Date.now() + 86400000).toISOString().split('T')[0]}>Tomorrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full h-12 rounded-xl font-semibold">
                Create Task
              </Button>
            </form>
          </motion.div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
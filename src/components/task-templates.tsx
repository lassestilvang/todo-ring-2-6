'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sparkles, BookTemplate, FileText, Store, Globe, Lock, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Star, Search } from 'lucide-react';
import { TemplateMarketplace } from '@/components/template-marketplace';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  template: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low' | 'none';
    estimateHours: number;
    estimateMinutes: number;
    isAllDay: boolean;
    recurringType: string;
  };
  category?: string;
  rating?: number;
  usageCount?: number;
  isPublic?: boolean;
}

interface PublicTemplate {
  id: string;
  name: string;
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  estimateHours: number;
  estimateMinutes: number;
  isAllDay: boolean;
  recurringType: string;
  labelIds: string[];
  category: string;
}

async function fetchTemplates(): Promise<TaskTemplate[]> {
  const res = await fetch('/api/templates?myTemplates=test-user');
  const json = await res.json();
  if (!json.success) throw new Error('Failed to fetch templates');
  return json.data;
}

interface TaskTemplatesProps {
  onCreateTask: (task: Partial<{ title: string; description: string; priority: 'high' | 'medium' | 'low' | 'none'; estimateHours: number; estimateMinutes: number; isAllDay: boolean; recurringType: string }>) => void;
}

export function TaskTemplates({ onCreateTask }: TaskTemplatesProps) {
  const [open, setOpen] = React.useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates,
  });

  // Mutation for publishing/unpublishing templates
  const publishMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const res = await fetch(`/api/templates/${id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publish: isPublic, userId: 'current-user' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to publish template');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleUseMarketplaceTemplate = (template: PublicTemplate) => {
    onCreateTask({
      title: template.title,
      description: template.description,
      priority: template.priority,
      estimateHours: template.estimateHours,
      estimateMinutes: template.estimateMinutes,
      isAllDay: template.isAllDay,
      recurringType: template.recurringType,
    });
  };

  const handlePublishToggle = (id: string, currentStatus: boolean) => {
    publishMutation.mutate({ id, isPublic: !currentStatus });
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.category && t.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleUseTemplate = (template: TaskTemplate) => {
    onCreateTask({
      title: template.template.title,
      description: template.template.description,
      priority: template.template.priority,
      estimateHours: template.template.estimateHours,
      estimateMinutes: template.template.estimateMinutes,
      isAllDay: template.template.isAllDay,
      recurringType: template.template.recurringType,
    });
    setOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-dashed"
            title="Task Templates"
          >
            <FileText className="w-3.5 h-3.5 mr-2" />
            Templates
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl rounded-2xl border-none shadow-2xl bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-500" />
              My Templates
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/60 font-medium">
              Save time by using predefined task templates.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>

            <div className="flex justify-end mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMarketplaceOpen(true)}
                className="text-brand-600 hover:text-brand-700"
              >
                <Store className="w-4 h-4 mr-2" />
                Browse Marketplace
              </Button>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <BookTemplate className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'No templates found matching your search' : 'No templates created yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative flex items-start gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-all"
                  >
                    <span className="text-3xl">{template.icon || '📋'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{template.name}</p>
                      <p className="text-[11px] text-muted-foreground/60 truncate">
                        {template.template.title || 'Click to use template'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {template.rating && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>{template.rating}</span>
                          </div>
                        )}
                        {template.usageCount && (
                          <span className="text-[10px] text-muted-foreground/60">
                            {template.usageCount} uses
                          </span>
                        )}
                        {template.isPublic && (
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        )}
                        {template.category && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {template.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handlePublishToggle(template.id, template.isPublic || false)}>
                          {template.isPublic ? (
                            <>
                              <Lock className="w-3.5 h-3.5 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5 mr-2" />
                              Publish to Marketplace
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Edit className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="absolute inset-0 w-full h-full cursor-pointer"
                      aria-label={`Use template ${template.name}`}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Marketplace Dialog */}
      <TemplateMarketplace
        open={marketplaceOpen}
        onOpenChange={setMarketplaceOpen}
        onCreateTask={handleUseMarketplaceTemplate}
      />
    </>
  );
}
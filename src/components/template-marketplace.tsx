'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Download, TrendingUp, Filter, Eye, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Template {
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
  usageCount: number;
  avgRating: number;
}

interface TemplateMarketplaceProps {
  onCreateTask?: (template: Partial<{ title: string; description: string; priority: 'high' | 'medium' | 'low' | 'none'; estimateHours: number; estimateMinutes: number; isAllDay: boolean; recurringType: string }>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

interface TemplateMarketplaceProps {
  onCreateTask?: (template: Partial<{ title: string; description: string; priority: 'high' | 'medium' | 'low' | 'none'; estimateHours: number; estimateMinutes: number; isAllDay: boolean; recurringType: string }>) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function TemplateMarketplace({ onCreateTask, open, onOpenChange, className }: TemplateMarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<string>('usage_count');
  const [previewTemplate, setPreviewTemplate] = React.useState<Template | null>(null);
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', 'marketplace', selectedCategory, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      params.set('sortBy', sortBy);
      params.set('limit', '50');

      const res = await fetch(`/api/templates/marketplace?${params.toString()}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
  });

  // Rating mutation
  const rateMutation = useMutation({
    mutationFn: async ({ templateId, rating }: { templateId: string; rating: number }) => {
      const res = await fetch('/api/templates/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, rating }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to rate template');
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', 'marketplace'] });
      toast.success('Rating submitted!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleRate = (templateId: string, rating: number) => {
    rateMutation.mutate({ templateId, rating });
  };

  const categories = [...new Set(templates.map((t: Template) => t.category))];

  const handleUseTemplate = (template: Template) => {
    onCreateTask?.({
      title: template.title,
      description: template.description,
      priority: template.priority,
      estimateHours: template.estimateHours,
      estimateMinutes: template.estimateMinutes,
      isAllDay: template.isAllDay,
      recurringType: template.recurringType,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-amber-500';
      case 'low': return 'text-blue-500';
      default: return 'text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted/30 rounded mb-2" />
              <div className="h-4 bg-muted/20 rounded w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted/20 rounded mb-4" />
              <div className="h-8 bg-muted/20 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-brand-500" />
          Template Marketplace
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Browse and use templates to quickly create tasks
        </p>
      </CardHeader>

      {/* Filters */}
      <div className="px-6 pb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="usage_count">Most Used</SelectItem>
            <SelectItem value="avg_rating">Top Rated</SelectItem>
            <SelectItem value="created_at">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <Download className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No templates found</p>
            <p className="text-sm text-muted-foreground/60">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: Template) => (
              <Card
                key={template.id}
                className="group hover:shadow-lg transition-shadow cursor-pointer border-brand-500/20 bg-brand-500/5"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{template.icon}</span>
                      <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500/50" />
                      <span className="text-sm font-medium">{template.avgRating.toFixed(1)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", getPriorityColor(template.priority))}
                      >
                        {template.priority}
                      </Badge>
                      <span className="text-muted-foreground">
                        {template.estimateHours}h {template.estimateMinutes}m
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      <span>{template.usageCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseTemplate(template);
                      }}
                    >
                        Use Template
                      </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{previewTemplate?.icon}</span>
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Title: {previewTemplate.title}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>Priority: {previewTemplate.priority}</span>
                  <span>Duration: {previewTemplate.estimateHours}h {previewTemplate.estimateMinutes}m</span>
                </div>
                {previewTemplate.recurringType !== 'none' && (
                  <p className="text-sm text-muted-foreground">
                    Recurring: {previewTemplate.recurringType}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Rate this template</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRate(previewTemplate.id, star)}
                      className="hover:scale-110 transition-transform"
                    >
                      <Star className="w-5 h-5 text-amber-500 hover:fill-amber-500" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleUseTemplate(previewTemplate)} className="flex-1">
                  Use This Template
                </Button>
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

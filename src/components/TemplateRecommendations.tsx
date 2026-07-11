import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useLiveRegion } from '@/hooks/useAccessibility';

/**
 * Template Recommendations Component
 * Shows AI-powered template suggestions based on user goals and history
 */
export function TemplateRecommendations({ userId, goal, limit = 5 }: { userId: string; goal?: string; limit?: number }) {
  const { data: recommendations, isLoading, refetch } = useQuery({
    queryKey: ['template-recommendations', userId, goal],
    queryFn: () => fetchTemplateRecommendations(userId, goal, limit),
    refetchInterval: 3600000 // 1 hour
  });

  const containerRef = useFocusTrap();
  const announce = useLiveRegion().announce;

  useEffect(() => {
    if (recommendations && recommendations.length > 0) {
      announce(`Found ${recommendations.length} template recommendations for you`);
    }
  }, [recommendations]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground/50">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No template recommendations available yet.</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/50 bg-card/50 p-6 lag-600 dark:bg-gray-800",
        "prose lg:prose-lg lg:pt-8 lg:pb-16 lg:br-2 lg:rounded-md"
      )}
      ref={containerRef}
      role="region"
      aria-label="Template recommendations section"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 className="font-bold text-xl">Recommended Templates</h2>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <motion.div
            key={rec.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-lg border border-muted/20 bg-muted/5 hover:bg-muted/10 transition-colors cursor-pointer"
            role="button"
            tabIndex={0}
            aria-label={`Apply template: ${rec.title}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleApplyTemplate(rec.id);
              }
            }}
            onClick={() => handleApplyTemplate(rec.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-lg">{rec.title}</h3>
                <p className="text-sm text-muted-foreground/60 mt-1 line-clamp-2">
                  {rec.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground/50">
                  <span>Used {rec.popularity} times</span>
                  <span>★ {rec.rating}</span>
                </div>
              </div>
              <button
                className="ml-2 text-primary hover:text-primary/80 transition-colors"
                aria-label={`Apply ${rec.title} template`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApplyTemplate(rec.id);
                }}
              >
                <Sparkles className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button
          className="text-sm text-primary hover:underline transition-all"
          aria-label="Refresh template recommendations"
          onClick={() => refetch()}
        >
          Refresh Recommendations
        </button>
      </div>
    </div>
  );
}

/**
 * Apply template to user
 */
function handleApplyTemplate(templateId: string) {
  // Implementation would open preview modal or apply template directly
  console.log(`Applying template ${templateId}`);
}

/**
 * Fetch template recommendations
 */
async function fetchTemplateRecommendations(userId: string, goal?: string, limit?: number) {
  // Mock implementation - would integrate with AI endpoint
  return [
    {
      id: 't1',
      title: 'Project Kickoff',
      description: 'Complete set of templates for launching new projects',
      popularity: 142,
      rating: 4.8
    },
    {
      id: 't2',
      title: 'Content Calendar',
      description: 'Organize and track content creation tasks',
      popularity: 89,
      rating: 4.6
    }
  ];
}
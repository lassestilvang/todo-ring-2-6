'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, TrendingUp, Target, Clock, Brain, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Insight {
  id: string;
  type: 'productivity' | 'pattern' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  metric?: string;
  createdAt: string;
}

interface AIInsightsProps {
  period?: 'day' | 'week' | 'month';
  className?: string;
  showPatterns?: boolean;
}

const insightIcons: Record<string, React.ReactNode> = {
  productivity: <Target className="w-4 h-4 text-brand-500" />,
  pattern: <TrendingUp className="w-4 h-4 text-amber-500" />,
  recommendation: <Lightbulb className="w-4 h-4 text-blue-500" />,
  prediction: <Clock className="w-4 h-4 text-purple-500" />,
};

const priorityColors = {
  high: 'bg-red-500/10 text-red-600 border-red-500/20',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  low: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
};

async function fetchAIInsights() {
  const res = await fetch('/api/analytics/ai?type=insights');
  const json = await res.json();
  if (!json.success) return { insights: [] };
  return { insights: json.data };
}

async function fetchPatterns() {
  const res = await fetch('/api/analytics/ai?type=patterns');
  const json = await res.json();
  if (!json.success) return { patterns: [] };
  return { patterns: json.data };
}

export function AIInsights({ period = 'week', className, showPatterns = true }: AIInsightsProps) {
  const { data: insightsData, isLoading: isLoadingInsights } = useQuery({
    queryKey: ['analytics-insights', period],
    queryFn: fetchAIInsights,
    refetchInterval: 120000,
  });

  const { data: patternsData, isLoading: isLoadingPatterns } = useQuery({
    queryKey: ['analytics-patterns'],
    queryFn: fetchPatterns,
    refetchInterval: 120000,
  });

  const insights = insightsData?.insights || [];
  const patterns = patternsData?.patterns || [];

  if (isLoadingInsights && isLoadingPatterns) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Brain className="w-5 h-5 text-brand-500" />
          AI-Powered Insights
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Smart recommendations to boost your productivity
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Insights */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
              <Lightbulb className="w-3 h-3" />
              Recommendations
            </h4>
            <div className="space-y-2">
              {insights.length === 0 ? (
                <p className="text-xs text-muted-foreground">No insights available</p>
              ) : (
                insights.map((insight: Insight) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                      'p-3 rounded-lg border bg-card/50',
                      priorityColors[insight.priority]
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {insightIcons[insight.type]}
                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                      </div>
                      {insight.metric && (
                        <Badge variant="outline" className="text-[10px]">
                          {insight.metric}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {insight.description}
                    </p>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Patterns */}
          {showPatterns && patterns.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Productivity Patterns
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {patterns.map((pattern: any, index: number) => (
                  <motion.div
                    key={pattern.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="text-center p-3 bg-muted/30 rounded-lg">
                      <p className="text-xl font-bold text-brand-500">{pattern.value}%</p>
                      <p className="text-xs text-muted-foreground">{pattern.name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
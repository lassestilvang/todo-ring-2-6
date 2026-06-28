'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, TrendingUp, Target, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

export function AIInsights({ period = 'week', className }: AIInsightsProps) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['analytics-insights', period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/insights?period=${period}`);
      const json = await res.json();
      return json.success ? json.data : { insights: [] };
    },
  });

  const insights = response?.insights || [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">AI Insights</CardTitle>
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

  if (insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="pt-6 text-center">
          <Lightbulb className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No insights available for this period</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-5 h-5 text-brand-500" />
          AI-Powered Insights
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Smart recommendations to boost your productivity
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight: Insight) => (
            <div
              key={insight.id}
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import * as React from 'react';
import { Bot, Send, Loader2, Sparkles, Lightbulb, Calendar, Tag, Flag, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { parseNaturalLanguage } from '@/lib/nlp';
import { format } from 'date-fns';

interface AIAssistantProps {
  onTaskCreate?: (task: { title: string; description?: string; date?: string; priority?: string }) => void;
}

interface AIResponse {
  title: string;
  description?: string;
  date?: string;
  priority?: 'high' | 'medium' | 'low' | 'none';
  tags?: string[];
  confidence: number;
  estimatedTime?: number; // in minutes
}

interface PrioritizedTask {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low' | 'none';
  score: number;
}

export function AIAssistant({ onTaskCreate }: AIAssistantProps) {
  const [input, setInput] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [lastResponse, setLastResponse] = React.useState<AIResponse | null>(null);
  const [prioritizedTasks, setPrioritizedTasks] = React.useState<PrioritizedTask[]>([]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // Use the existing NLP parser
      const parsed = parseNaturalLanguage(input);

      const response: AIResponse = {
        title: parsed.title,
        description: parsed.description,
        date: parsed.date || undefined,
        priority: parsed.priority || 'none',
        confidence: 0.9,
        estimatedTime: estimateTime(parsed.title),
      };

      setLastResponse(response);

      // Auto-create the task
      setTimeout(() => {
        onTaskCreate?.({
          title: parsed.title,
          description: parsed.description,
          date: parsed.date || undefined,
          priority: parsed.priority || 'none',
        });
      }, 1500);
    } catch (error) {
      console.error('AI processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const estimateTime = (title: string): number => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('meeting') || lowerTitle.includes('call')) return 30;
    if (lowerTitle.includes('report') || lowerTitle.includes('analysis')) return 120;
    if (lowerTitle.includes('email') || lowerTitle.includes('review')) return 15;
    if (lowerTitle.includes('presentation')) return 180;
    return 30; // default
  };

  const suggestions = [
    "Meeting with design team tomorrow at 2pm",
    "Review quarterly report by Friday",
    "Call mom next week",
    "Submit timesheet before EOD",
    "Prepare presentation for Monday",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bot className="w-5 h-5 text-brand-500" />
          AI Assistant
        </h3>
        <Badge variant="outline">
          <Sparkles className="w-3 h-3 mr-1" />
          Smart
        </Badge>
      </div>

      {/* Input */}
      <div className="space-y-3">
        <div className="relative">
          <Textarea
            placeholder="Describe what you want to do... (e.g., 'Call John tomorrow')"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            disabled={isProcessing}
          />
          <Button
            size="sm"
            className="absolute right-2 bottom-2"
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              className="text-xs px-2 py-1 rounded-md bg-muted/50 hover:bg-muted/80 transition-colors text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Response preview */}
      {lastResponse && (
        <Card className={cn("border-brand-500/20 bg-brand-500/5", isProcessing && "animate-pulse")}>
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between">
              <h4 className="font-medium">{lastResponse.title}</h4>
              <Badge variant="outline" className="text-[10px]">
                {Math.round(lastResponse.confidence * 100)}% match
              </Badge>
            </div>

            {lastResponse.description && (
              <p className="text-sm text-muted-foreground">{lastResponse.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs">
              {lastResponse.date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {lastResponse.date}
                </span>
              )}
              {lastResponse.priority !== 'none' && (
                <span className={cn(
                  "flex items-center gap-1",
                  lastResponse.priority === 'high' && "text-red-500",
                  lastResponse.priority === 'medium' && "text-amber-500",
                  lastResponse.priority === 'low' && "text-blue-500"
                )}>
                  <Flag className="w-3 h-3" />
                  {lastResponse.priority}
                </span>
              )}
              {lastResponse.estimatedTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{lastResponse.estimatedTime}m
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Smart Prioritization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Smart Prioritization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Based on your tasks, here are prioritization suggestions:
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span>High Priority</span>
              <span className="text-muted-foreground">Due soon, high impact</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Medium Priority</span>
              <span className="text-muted-foreground">Normal importance</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Low Priority</span>
              <span className="text-muted-foreground">Flexible timing</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <div className="text-[10px] text-muted-foreground/60">
        <p className="flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          Tips: Use natural language like "Call John tomorrow at 3pm" or "Review PR by Friday"
        </p>
      </div>
    </div>
  );
}


'use client';

import * as React from 'react';
import { EnhancedAnalyticsDashboard } from '@/components/enhanced-analytics-dashboard';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="mb-4 -ml-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-black tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground/60 mt-2">
            Detailed insights into your productivity and task management
          </p>
        </div>

        <EnhancedAnalyticsDashboard />
      </div>
    </div>
  );
}
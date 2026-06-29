import { dynamic } from 'next/dynamic';
import { useEffect } from 'react';

const EnhancedAnalyticsDashboard = dynamic(() => import('@/components/enhanced-analytics-dashboard'), {
  loading: () => <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>,
});

export default function DynamicAnalyticsLoader() {
  useEffect(() => {
    // Optional: Add any component-level initialization logic here
    console.log('DynamicAnalyticsLoader mounted');
  }, []);

  return <EnhancedAnalyticsDashboard />;
}
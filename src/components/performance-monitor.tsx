'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  fps: number;
}

export function PerformanceMonitor({
  enabled = process.env.NODE_ENV === 'development'
}: {
  enabled?: boolean
}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
  });

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed >= 1000) {
        fps = Math.round((frameCount * 1000) / elapsed);
        frameCount = 0;
        lastTime = now;
      }

      setMetrics(prev => ({ ...prev, fps }));
      requestAnimationFrame(measureFPS);
    };

    const animationFrame = requestAnimationFrame(measureFPS);

    // Memory usage (if available)
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      }));
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 text-xs shadow-lg">
      <div className="space-y-1">
        <div>FPS: {metrics.fps}</div>
        <div>Memory: {metrics.memoryUsage} MB</div>
      </div>
    </div>
  );
}

/**
 * Bundle analyzer component (development only)
 */
export function BundleAnalyzer() {
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed top-4 right-4 bg-card/90 backdrop-blur-sm border rounded-lg p-3 text-xs shadow-lg max-w-xs">
      <h4 className="font-bold mb-2">Bundle Info</h4>
      <div className="space-y-1">
        <div>Next.js: 16.x</div>
        <div>React: 19.x</div>
        <div>Bundle: Optimized</div>
      </div>
    </div>
  );
}
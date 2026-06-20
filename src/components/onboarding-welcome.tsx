'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ListTodo, Share2, BarChart3, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OnboardingWelcomeProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingWelcome({ open, onComplete }: OnboardingWelcomeProps) {
  const steps = [
    {
      title: 'Welcome to TaskPlanner',
      description: 'Your personal productivity hub for managing tasks, projects, and goals.',
      icon: Sparkles,
      color: 'text-brand-500',
      bg: 'bg-brand-500/10',
    },
    {
      title: 'Organize Tasks',
      description: 'Create lists, set priorities, and track deadlines. Everything you need to stay on top of your work.',
      icon: ListTodo,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'Collaborate with Team',
      description: 'Share tasks and lists with colleagues. Assign roles and track progress together.',
      icon: Share2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Track Progress',
      description: 'View analytics, track time, and measure your productivity with detailed insights.',
      icon: BarChart3,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
  ];

  const [currentStep, setCurrentStep] = React.useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipOnboarding = () => {
    localStorage.setItem('taskplanner-onboarding-completed', 'true');
    onComplete();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {}}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md rounded-2xl bg-card/95 backdrop-blur-xl border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={skipOnboarding}
              className="absolute top-4 right-4 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="p-6 sm:p-8">
              <div className="space-y-6">
                {/* Step indicator */}
                <div className="flex justify-center gap-2">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-2 rounded-full transition-all',
                        i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-muted'
                      )}
                    />
                  ))}
                </div>

                {/* Content */}
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <div className={cn(
                    'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4',
                    steps[currentStep]?.bg || ''
                  )}>
                    {steps[currentStep] && React.createElement(steps[currentStep].icon, {
                      className: cn('w-8 h-8', steps[currentStep].color)
                    })}
                  </div>
                  <h3 className="text-xl font-black mb-2">{steps[currentStep]?.title || ''}</h3>
                  <p className="text-muted-foreground/80 text-sm leading-relaxed">
                    {steps[currentStep]?.description || ''}
                  </p>
                </motion.div>

                {/* Navigation */}
                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                  <Button variant="ghost" onClick={skipOnboarding} className="text-sm">
                    Skip
                  </Button>
                  <Button onClick={nextStep} className="font-semibold">
                    {currentStep < steps.length - 1 ? 'Continue' : 'Get Started'}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
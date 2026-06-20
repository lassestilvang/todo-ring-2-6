'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PWAPromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PWAPrompt({ open, onOpenChange }: PWAPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userAccept();

    if (outcome === 'accepted') {
      onOpenChange(false);
    }
    setDeferredPrompt(null);
  };

  if (!deferredPrompt) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm rounded-2xl bg-card/95 backdrop-blur-xl border shadow-2xl p-6"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-brand-500" />
              </div>

              <div>
                <h3 className="text-xl font-black mb-2">Install TaskPlanner</h3>
                <p className="text-sm text-muted-foreground/80">
                  Install this app on your device for quick access and offline support.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Later
                </Button>
                <Button onClick={handleInstall} className="flex-1 font-semibold">
                  <Download className="w-4 h-4 mr-2" />
                  Install
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
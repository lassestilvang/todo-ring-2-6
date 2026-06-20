'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Calendar, ListFilter, CheckCircle2, Clock, Target } from 'lucide-react';

interface EmptyStateIllustrationProps {
  view: string;
  className?: string;
}

// SVG components for each empty state
const TaskEmptyIllustration = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.path
      d="M40 80H160C171.046 80 180 88.954 180 100V140C180 151.046 171.046 160 160 160H40C28.9544 160 20 151.046 20 140V100C20 88.9544 28.9544 80 40 80Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={{
        animate: {
          pathLength: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
    <motion.circle
      cx="80"
      cy="120"
      r="8"
      fill="currentColor"
      variants={{
        animate: {
          scale: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.5, delay: 0.2, ease: "backOut" }}
    />
    <motion.circle
      cx="120"
      cy="120"
      r="8"
      fill="currentColor"
      variants={{
        animate: {
          scale: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.5, delay: 0.3, ease: "backOut" }}
    />
    <motion.path
      d="M60 60L140 60"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      variants={{
        animate: {
          pathLength: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
    />
    <motion.path
      d="M80 40L120 40"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      variants={{
        animate: {
          pathLength: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
    />
  </svg>
);

const CalendarEmptyIllustration = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.rect
      x="40"
      y="40"
      width="120"
      height="100"
      rx="8"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      variants={{
        animate: {
          pathLength: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
    <motion.line
      x1="40"
      y1="70"
      x2="160"
      y2="70"
      stroke="currentColor"
      strokeWidth="2"
      variants={{
        animate: {
          pathLength: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
    />
    <motion.circle
      cx="80"
      cy="100"
      r="6"
      fill="currentColor"
      variants={{
        animate: {
          scale: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay: 0.3, ease: "backOut" }}
    />
  </svg>
);

const CheckEmptyIllustration = () => (
  <svg width="200" height="160" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
    <motion.circle
      cx="100"
      cy="80"
      r="40"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      variants={{
        animate: {
          pathLength: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.8, ease: "easeOut" }}
    />
    <motion.path
      d="M85 80L110 105L140 70"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      variants={{
        animate: {
          pathLength: [0, 1],
          opacity: [0, 1],
        },
      }}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
    />
  </svg>
);

const illustrations = {
  today: { component: <TaskEmptyIllustration />, color: 'text-brand-500/30' },
  next7: { component: <CalendarEmptyIllustration />, color: 'text-amber-500/30' },
  upcoming: { component: <CalendarEmptyIllustration />, color: 'text-blue-500/30' },
  all: { component: <ListFilter className="w-24 h-24" />, color: 'text-purple-500/30' },
  list: { component: <TaskEmptyIllustration />, color: 'text-emerald-500/30' },
  completed: { component: <CheckEmptyIllustration />, color: 'text-emerald-500/30' },
  default: { component: <Sparkles className="w-24 h-24" />, color: 'text-muted-foreground/30' },
};

export function EmptyStateIllustration({ view, className }: EmptyStateIllustrationProps) {
  const illo = illustrations[view as keyof typeof illustrations] || illustrations.default;

  return (
    <div className={className}>
      <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-card/50 ${illo.color} mb-4`}>
        {illo.component}
      </div>
    </div>
  );
}
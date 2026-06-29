import type { Task } from '@/types/index';
import { format, addHours, isAfter, isBefore, parseISO } from 'date-fns';

export interface ScheduleSlot {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  energyLevel: 'high' | 'medium' | 'low';
}

export interface ScheduleOptimizationResult {
  slots: ScheduleSlot[];
  recommendations: string[];
  efficiencyScore: number;
}

interface SchedulerOptions {
  workingHours: { start: number; end: number }; // 24h format
  preferredHours: number[]; // e.g., [9, 10, 11, 14, 15, 16]
  energyPattern: 'morning' | 'afternoon' | 'evening' | 'custom';
  bufferMinutes: number;
}

export class ScheduleOptimizer {
  private options: SchedulerOptions;

  constructor(options: Partial<SchedulerOptions> = {}) {
    this.options = {
      workingHours: { start: 9, end: 17 },
      preferredHours: [9, 10, 11, 14, 15, 16],
      energyPattern: 'custom',
      bufferMinutes: 15,
      ...options,
    };
  }

  optimize(tasks: Task[], currentDate: Date = new Date()): ScheduleOptimizationResult {
    const slots: ScheduleSlot[] = [];
    const recommendations: string[] = [];
    let efficiencyScore = 0;

    // Filter tasks that need scheduling
    const unscheduledTasks = tasks.filter(t => !t.date && t.status !== 'completed' && t.status !== 'cancelled');

    // Sort by priority and deadline
    const sortedTasks = [...unscheduledTasks].sort((a, b) => {
      // High priority first
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      // Then by deadline
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return 0;
    });

    // Generate schedule
    let currentSlotStart = this.getWorkdayStart(currentDate);

    for (const task of sortedTasks) {
      const estimatedDuration = this.estimateTaskDuration(task);
      const slotEnd = addHours(currentSlotStart, estimatedDuration);

      const slot: ScheduleSlot = {
        id: `${task.id}-${currentSlotStart.getTime()}`,
        taskId: task.id,
        startTime: currentSlotStart,
        endTime: slotEnd,
        energyLevel: this.getEnergyLevel(currentSlotStart),
      };

      slots.push(slot);
      currentSlotStart = addHours(slotEnd, this.options.bufferMinutes / 60);
    }

    // Generate recommendations
    if (slots.length > 0) {
      recommendations.push(`Scheduled ${slots.length} tasks for optimal productivity`);

      const highPrioritySlots = slots.filter(s => {
        const task = tasks.find(t => t.id === s.taskId);
        return task?.priority === 'high';
      });

      if (highPrioritySlots.length > 0) {
        recommendations.push(`${highPrioritySlots.length} high-priority tasks scheduled`);
      }
    }

    // Calculate efficiency score
    const totalEstimatedHours = sortedTasks.reduce((sum, t) => {
      return sum + this.estimateTaskDuration(t);
    }, 0);

    const availableHours = (this.options.workingHours.end - this.options.workingHours.start);
    efficiencyScore = Math.min(100, Math.round((totalEstimatedHours / availableHours) * 100));

    return {
      slots,
      recommendations,
      efficiencyScore,
    };
  }

  private estimateTaskDuration(task: Task): number {
    const hours = task.estimateHours || 0;
    const minutes = task.estimateMinutes || 0;
    const baseHours = hours + minutes / 60;

    // Apply priority multiplier
    const priorityMultiplier = task.priority === 'high' ? 1.2 : task.priority === 'low' ? 0.8 : 1;

    return Math.max(0.25, baseHours * priorityMultiplier);
  }

  private getWorkdayStart(date: Date): Date {
    const start = new Date(date);
    start.setHours(this.options.workingHours.start, 0, 0, 0);
    return start;
  }

  private getEnergyLevel(time: Date): 'high' | 'medium' | 'low' {
    const hour = time.getHours();

    if (this.options.energyPattern === 'morning') {
      return hour >= 6 && hour <= 12 ? 'high' : hour >= 13 && hour <= 17 ? 'medium' : 'low';
    }

    if (this.options.energyPattern === 'afternoon') {
      return hour >= 12 && hour <= 16 ? 'high' : hour >= 9 && hour <= 11 ? 'medium' : 'low';
    }

    if (this.options.energyPattern === 'evening') {
      return hour >= 17 && hour <= 21 ? 'high' : hour >= 12 && hour <= 16 ? 'medium' : 'low';
    }

    // Custom: check preferred hours
    if (this.options.preferredHours.includes(hour)) {
      return 'high';
    }

    return 'medium';
  }

  suggestOptimalTimeslots(date: Date, durationHours: number): Date[] {
    const slots: Date[] = [];
    const start = this.getWorkdayStart(date);

    for (let i = 0; i < (this.options.workingHours.end - this.options.workingHours.start); i++) {
      const slotStart = addHours(start, i);
      const slotEnd = addHours(slotStart, durationHours);

      if (
        this.options.preferredHours.includes(slotStart.getHours()) &&
        slotEnd.getHours() <= this.options.workingHours.end
      ) {
        slots.push(slotStart);
      }
    }

    return slots.slice(0, 5); // Return top 5 suggestions
  }
}

export function optimizeSchedule(tasks: Task[], options?: Partial<SchedulerOptions>): ScheduleOptimizationResult {
  const optimizer = new ScheduleOptimizer(options);
  return optimizer.optimize(tasks);
}
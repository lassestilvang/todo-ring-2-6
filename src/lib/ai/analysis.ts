/**
 * AI Analysis Engine for TaskPlanner
 * Handles task prioritization, scheduling optimization, and contextual analysis
 */

import { TASK_ANALYSIS_PROMPT, SCHEDULING_OPTIMIZER_PROMPT } from './prompts';

export interface TaskAnalysis {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  deadline: string | null;
  context: string;
  causalAnalysis: string;
}

export interface ScheduledTask {
  id: string;
  title: string;
  scheduledTime: string;
  duration: number;
  priority: number;
}

/**
 * Analyze a task using AI to extract priority, tags, and context
 */
export async function analyzeTaskSignature(taskText: string): Promise<TaskAnalysis> {
  // In production, this would call the Claude API
  // For now, implement rule-based fallback

  const urgencyMarkers = ['urgent', 'asap', 'immediately', 'critical', '!'];
  const projectMarkers = ['project', 'sprint', 'milestone', 'release'];
  const personalMarkers = ['personal', 'family', 'doctor', 'gym'];

  let priority: TaskAnalysis['priority'] = 'medium';

  for (const marker of urgencyMarkers) {
    if (taskText.toLowerCase().includes(marker)) {
      priority = 'urgent';
      break;
    }
  }

  const tags: string[] = [];
  if (taskText.match(/\b(project|sprint|milestone|release)\b/i)) {
    tags.push('work');
  }
  if (taskText.match(/\b(personal|family|doctor|gym)\b/i)) {
    tags.push('personal');
  }

  // Extract deadline using regex patterns
  const dateMatch = taskText.match(/(?:today|tomorrow|next\s+\w+|\d{1,2}[\/]\d{1,2}[\/]\d{4}|\d{4}-\d{2}-\d{2})/i);
  const timeMatch = taskText.match(/@\s*\d{1,2}(?::\d{2})?/i);

  let deadline = null;
  if (dateMatch || timeMatch) {
    deadline = combineDateAndTime(dateMatch?.[0], timeMatch?.[0]);
  }

  return {
    priority,
    tags,
    deadline,
    context: tags.join(', ') || 'general',
    causalAnalysis: 'This task contributes to your overall productivity and goal achievement.'
  };
}

/**
 * Optimize schedule for a set of tasks
 */
export async function optimizeSchedule(tasks: any[]): Promise<ScheduledTask[]> {
  // Priority-weighted scheduling algorithm
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
    return (priorityWeights[b.priority as keyof typeof priorityWeights] || 0) -
           (priorityWeights[a.priority as keyof typeof priorityWeights] || 0);
  });

  // Schedule with buffer time
  let currentTime = new Date();
  currentTime.setHours(9, 0, 0, 0); // Start at 9 AM

  return sortedTasks.map(task => {
    const scheduled: ScheduledTask = {
      id: task.id,
      title: task.title,
      scheduledTime: currentTime.toISOString(),
      duration: task.estimatedDuration || 60,
      priority: priorityWeights[task.priority] || 2
    };

    currentTime.setTime(currentTime.getTime() + (scheduled.duration + 15) * 60000); // Add 15min buffer
    return scheduled;
  });
}

/**
 * Combine date and time strings into ISO format
 */
function combineDateAndTime(dateStr?: string, timeStr?: string): string | null {
  const now = new Date();
  let result = now;

  if (dateStr) {
    if (dateStr.toLowerCase() === 'today') {
      result = now;
    } else if (dateStr.toLowerCase() === 'tomorrow') {
      result = new Date(now);
      result.setDate(result.getDate() + 1);
    } else {
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        result = parsedDate;
      }
    }
  }

  if (timeStr) {
    const timeMatch = timeStr.match(/@(\d+)(?::(\d+))?/);
    if (timeMatch) {
      result.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2] || '0'));
    }
  }

  return result.toISOString();
}

const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
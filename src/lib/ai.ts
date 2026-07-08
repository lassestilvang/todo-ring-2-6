import { Configuration, OpenAIApi } from 'openai';
import { z } from 'zod';

const OPENAI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 10000,
  maxRetries: 3,
};

const openai = new OpenAIApi(new Configuration(OPENAI_CONFIG));

// Input validation schemas
const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string().optional(),
  priority: z.number().min(1).max(5),
  dependencies: z.array(z.string()).optional(),
  assignee: z.string().optional().nullable(),
  estimateHours: z.number().optional(),
  actualHours: z.number().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
});

const GoalSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  targetValue: z.number(),
  currentValue: z.number().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
});

type TaskForAI = z.infer<typeof TaskSchema>;
type GoalForAI = z.infer<typeof GoalSchema>;

/**
 * Analyze tasks for prioritization
 *
 * @param tasks - Array of task objects
 * @param context - User-specific context (workload, preferences, etc.)
 * @returns - Prioritized task list with insights
 */
async function prioritizeTasks(tasks: any[], context: any = {}): Promise<{
  sortedTasks: TaskForAI[];
  keyInsights: string;
  deadlineAlerts: string;
}> {
  // Validate and sanitize input
  const validatedTasks = z.array(TaskSchema).parse(tasks);

  const prompt = `Prioritize these tasks based on dependencies, deadlines, and importance. Consider workload balance and time estimates.

${validatedTasks.map(task =>
  `- ${task.title} (Deadline: ${task.dueDate || 'No deadline'}, Priority: ${task.priority}, Estimate: ${task.estimateHours || 0}h, Status: ${task.status})`
).join('\n')}

Context: ${JSON.stringify(context)}

Return JSON object with:
- sortedTasks: Array of task IDs in priority order
- keyInsights: Important patterns or dependency chains
- deadlineAlerts: Any imminent deadlines within 24 hours

Format: { "sortedTasks": ["id1", "id2"], "keyInsights": "...", "deadlineAlerts": "..." }`;

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4-turbo',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    const result = JSON.parse(content);
    // Validate response
    return z.object({
      sortedTasks: z.array(z.string()),
      keyInsights: z.string(),
      deadlineAlerts: z.string(),
    }).parse(result);
  } catch (error) {
    console.error('AI Prioritization Error:', error);
    // Fallback: sort by priority and deadline
    return {
      sortedTasks: validatedTasks
        .sort((a, b) => {
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          return b.priority - a.priority;
        })
        .map(t => t.id),
      keyInsights: 'AI unavailable - using priority-based ordering',
      deadlineAlerts: validatedTasks
        .filter(t => t.dueDate && new Date(t.dueDate).getTime() - Date.now() < 24 * 60 * 60 * 1000)
        .map(t => t.title)
        .join(', '),
    };
  }
}

/**
 * Break down goal into actionable tasks
 */
async function breakdownGoal(goal: any): Promise<any[]> {
  const validatedGoal = GoalSchema.parse(goal);

  const prompt = `Break down this goal into 3-7 actionable tasks:

Goal: ${validatedGoal.title}
${validatedGoal.description ? `Description: ${validatedGoal.description}` : ''}
Target: ${validatedGoal.targetValue} ${validatedGoal.category || 'items'}
End Date: ${validatedGoal.endDate || 'Flexible'}

Return JSON array of tasks with: title, priority (1-5), estimateHours, dependsOn (optional task IDs)

Format: [{ "title": "...", "priority": 3, "estimateHours": 2, "dependsOn": [] }]`;

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4-turbo',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 1000,
      temperature: 0.5,
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content);
  } catch (error) {
    console.error('AI Goal Breakdown Error:', error);
    // Fallback: create single task from goal
    return [{
      title: validatedGoal.title,
      priority: 3,
      estimateHours: Math.ceil(validatedGoal.targetValue / 4),
    }];
  }
}

/**
 * Predict task completion times and suggest schedule
 */
async function predictSchedule(tasks: any[], preferences: any = {}): Promise<any> {
  const validatedTasks = z.array(TaskSchema).parse(tasks);

  const historicalData = await getHistoricalPerformance();

  const prompt = `Predict completion times and suggest optimal schedule:

Tasks: ${validatedTasks.map(t => `${t.title} (${t.estimateHours || 'unknown'}h)`).join(', ')}

Historical Performance: ${JSON.stringify(historicalData)}

Preferences: ${JSON.stringify(preferences)}

Return JSON with: suggestedSchedule (array of {taskId, recommendedStartTime}), totalEstimatedTime, confidenceScore (0-1)`;

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-4-turbo',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 1000,
      temperature: 0.2,
    });

    const content = response.data.choices[0]?.message?.content;
    if (!content) throw new Error('No response from AI');

    return JSON.parse(content);
  } catch (error) {
    console.error('AI Schedule Prediction Error:', error);
    // Fallback: use estimates
    const totalHours = validatedTasks.reduce((sum, t) => sum + (t.estimateHours || 1), 0);
    const startDate = new Date();
    return {
      suggestedSchedule: validatedTasks.map((t, i) => ({
        taskId: t.id,
        recommendedStartTime: new Date(startDate.getTime() + i * 60 * 60 * 1000).toISOString(),
      })),
      totalEstimatedTime: totalHours,
      confidenceScore: 0.5,
    };
  }
}

/**
 * Get historical performance data for accuracy
 */
async function getHistoricalPerformance(): Promise<Record<string, any>> {
  // Placeholder for historical data collection
  return {
    avgCompletionRate: 0.75,
    avgOverrun: 1.2,
    preferredWorkHours: [9, 10, 14, 15, 16],
  };
}

// Export all AI functions
export { prioritizeTasks, breakdownGoal, predictSchedule };
export type { TaskForAI, GoalForAI };

/**
 * AI Prompt Templates for TaskPlanner
 * Contains structured prompts for AI-powered task analysis and routing
 */

export const TASK_ANALYSIS_PROMPT = `
You are TaskPlanner's AI assistant. Analyze the following task and provide:
1. Priority level (low, medium, high, urgent)
2. Extracted tags/categories
3. Suggested deadline (if implied)
4. Related context (meeting, project, personal, etc.)
5. Causal analysis: why this task matters and what it enables

Task: {{taskText}}

Respond in JSON format:
{
  "priority": "low|medium|high|urgent",
  "tags": ["tag1", "tag2"],
  "deadline": "ISO date or null",
  "context": "brief description",
  "causalAnalysis": "explanation of importance and dependencies"
}
` as const;

export const SCHEDULING_OPTIMIZER_PROMPT = `
You are a scheduling optimization expert. Given a list of tasks with their priorities and contexts,
create an optimal schedule that considers:
- Priority weighting
- Time dependencies
- Energy patterns (morning vs afternoon)
- Buffer time between tasks

Tasks: {{tasks}}

Return a JSON array of scheduled tasks with time blocks.
` as const;

export const WEEKLY_REVIEW_PROMPT = `
Analyze the user's completed and pending tasks for the week.
Provide insights on:
1. Productivity patterns
2. Overlooked priorities
3. Burnout risk assessment
4. Next week recommendations

Format as markdown insights.
` as const;
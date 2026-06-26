import { NextRequest } from 'next/server';
import { ensureDbInitialized } from '@/lib/db-init';
import { jsonSuccess, jsonError, jsonValidationError } from '@/lib/api-response';
import { AIAssistantSchema } from '@/lib/validations';
import { parseNaturalLanguage } from '@/lib/nlp';
import { getAIMonitoringService } from '@/lib/monitoring/ai-monitoring.service';

ensureDbInitialized();

// Performance monitoring decorator
function withMonitoring(handler) {
  return async (req, ...args) => {
    const startTime = Date.now();
    const monitoringService = getAIMonitoringService();

    try {
      const result = await handler(req, ...args);
      const responseTime = Date.now() - startTime;

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const userId = req.headers.get('x-user-id') || 'anonymous';
      const prompt = await req.clone().json().then(body => body.prompt);

      monitoringService.logAIInteraction({
        userId,
        prompt: prompt || '',
        action: 'error',
        confidence: 0,
        responseTimeMs: responseTime,
        success: false,
        errorMessage: error.message
      });

      return jsonError(error instanceof Error ? error.message : 'Failed to process AI command', 500, 'AI_ERROR');
    }
  };
}

// LLM Configuration (optional - only used if API key is available)
const LLM_PROVIDER = process.env.AI_PROVIDER || 'rule-based'; // 'openai', 'anthropic', or 'rule-based'
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

/**
 * AI Assistant API for processing natural language commands
 * Supports both rule-based parsing and LLM-powered parsing
 */
export async function POST(_req: NextRequest) {
  const startTime = Date.now();
  const monitoringService = getAIMonitoringService();
  let userId = 'anonymous';

  try {
    const body = await _req.json();
    userId = body.context?.userId || 'anonymous';
    const validated = AIAssistantSchema.safeParse(body);

    if (!validated.success) {
      return jsonValidationError(
        validated.error.errors.map(e => ({ path: e.path, message: e.message }))
      );
    }

    const { prompt, context } = validated.data;
    const result = await processAICommand(prompt, context);

    const responseTime = Date.now() - startTime;

    // Log successful interaction
    await monitoringService.logAIInteraction({
      userId,
      prompt,
      action: result.action,
      confidence: result.confidence,
      responseTimeMs: responseTime,
      success: true
    });

    return jsonSuccess(result);
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const monitoringService = getAIMonitoringService();

    // Log failed interaction
    await monitoringService.logAIInteraction({
      userId,
      prompt: '',
      action: 'error',
      confidence: 0,
      responseTimeMs: responseTime,
      success: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error'
    });

    const message = error instanceof Error ? error.message : 'Failed to process AI command';
    return jsonError(message, 500, 'AI_ERROR');
  }
}

async function processAICommand(prompt: string, context?: any) {
  // Try LLM-based parsing if API key is available
  if (LLM_API_KEY && LLM_PROVIDER !== 'rule-based') {
    try {
      const llmResult = await processWithLLM(prompt, context);
      if (llmResult.confidence > 0.7) {
        return llmResult;
      }
    } catch (error) {
      console.warn('LLM processing failed, falling back to rule-based:', error);
    }
  }

  // Fall back to rule-based parsing
  return processRuleBased(prompt);
}

async function processWithLLM(prompt: string, context?: any) {
  const systemPrompt = `
You are a task extraction AI. Parse natural language into structured task data.

Return a JSON object with the following structure:
{
  "action": "create_task" | "view_tasks" | "complete_task" | "delete_task" | "set_priority" | "suggest",
  "confidence": 0.0-1.0,
  "data": {
    "title": "string",
    "description": "string",
    "date": "YYYY-MM-DD",
    "deadline": "YYYY-MM-DD",
    "priority": "high" | "medium" | "low" | "none",
    "estimateHours": number,
    "estimateMinutes": number
  },
  "suggestions": ["string"]
}

Context: ${context ? JSON.stringify(context) : 'No context provided'}
  `.trim();

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LLM_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error('LLM API request failed');
  }

  const json = await response.json();
  const content = json.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from LLM');
  }

  return JSON.parse(content);
}

function processRuleBased(prompt: string) {
  const lowerPrompt = prompt.toLowerCase().trim();
  const result: any = {
    action: 'unknown',
    confidence: 0,
    data: null,
    suggestions: [],
  };

  // Check for task creation
  if (lowerPrompt.includes('task') || lowerPrompt.includes('create') || lowerPrompt.includes('add')) {
    const parsed = parseNaturalLanguage(prompt);
    result.action = 'create_task';
    result.confidence = 0.85;
    result.data = {
      title: parsed.title || prompt,
      description: parsed.description,
      date: parsed.date,
      priority: parsed.priority,
    };
    result.suggestions = generateTaskSuggestions(parsed);
  }

  // Check for list operations
  else if (lowerPrompt.includes('list') || lowerPrompt.includes('show') || lowerPrompt.includes('view')) {
    result.action = 'view_tasks';
    result.confidence = 0.7;

    if (lowerPrompt.includes('today') || lowerPrompt.includes('daily')) {
      result.data = { filter: 'today' };
    } else if (lowerPrompt.includes('week') || lowerPrompt.includes('next 7')) {
      result.data = { filter: 'next7' };
    } else if (lowerPrompt.includes('overdue') || lowerPrompt.includes('late')) {
      result.data = { filter: 'overdue' };
    } else {
      result.data = { filter: 'all' };
    }
  }

  // Check for completion
  else if (lowerPrompt.includes('complete') || lowerPrompt.includes('done') || lowerPrompt.includes('finish')) {
    result.action = 'complete_task';
    result.confidence = 0.8;
    result.suggestions = ['Select a task to mark as complete'];
  }

  // Check for deletion
  else if (lowerPrompt.includes('delete') || lowerPrompt.includes('remove') || lowerPrompt.includes('cancel')) {
    result.action = 'delete_task';
    result.confidence = 0.8;
    result.suggestions = ['Select a task to delete'];
  }

  // Check for priority
  else if (lowerPrompt.includes('high priority') || lowerPrompt.includes('urgent')) {
    result.action = 'set_priority';
    result.confidence = 0.75;
    result.data = { priority: 'high' };
  }

  // Default: provide suggestions
  else {
    result.action = 'suggest';
    result.confidence = 0.3;
    result.suggestions = [
      'Create a new task: "Create a task named..."',
      'View tasks: "Show me my tasks for today"',
      'Set priority: "Mark this as high priority"',
      'Complete task: "Mark task X as complete"',
      'Get smart schedule: "Suggest optimal times for my tasks"',
      'Check conflicts: "Find scheduling conflicts"',
    ];
  }

  return result;
}

function generateTaskSuggestions(parsed: any): string[] {
  const suggestions: string[] = [];

  if (!parsed.title) {
    suggestions.push('What should the task be called?');
  }

  if (!parsed.date) {
    suggestions.push('When should this task be completed?');
  }

  if (parsed.priority === 'none') {
    suggestions.push('Would you like to set a priority?');
  }

  return suggestions;
}

export async function GET(_req: NextRequest) {
  const { searchParams } = new URL(_req.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'examples':
      return jsonSuccess({
        examples: [
          'Create a task to review the quarterly report by Friday',
          'Remind me to call the client tomorrow at 2pm',
          'Show me my high priority tasks',
          'Mark the meeting task as complete',
          'Add a low priority label to task 123',
        ],
      });

    case 'capabilities':
      return jsonSuccess({
        capabilities: [
          'Create tasks with natural language',
          'Set priorities and due dates',
          'View and filter tasks',
          'Complete and delete tasks',
          'Manage lists and labels',
        ],
      });

    default:
      return jsonSuccess({ message: 'AI Assistant API' });
  }
}
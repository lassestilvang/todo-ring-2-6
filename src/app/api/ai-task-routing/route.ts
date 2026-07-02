import { NextRequest, NextResponse } from 'next/server';
import { analyzeTaskSignature } from '@/lib/ai/analysis';
import { Anthropic } from '@anthropic-ai/sdk';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskText } = body;

    if (!taskText) {
      return NextResponse.json(
        { error: 'Task text is required' },
        { status: 400 }
      );
    }

    // First try rule-based analysis for quick response
    const ruleBasedAnalysis = await analyzeTaskSignature(taskText);

    // If we have an API key, enhance with Claude AI
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const enhancedAnalysis = await enhanceWithClaude(taskText, ruleBasedAnalysis);
        return NextResponse.json(enhancedAnalysis, { status: 200 });
      } catch (aiError) {
        console.warn('Claude AI enhancement failed, falling back to rule-based:', aiError);
        // Fall back to rule-based analysis
        return NextResponse.json(ruleBasedAnalysis, { status: 200 });
      }
    }

    // Return rule-based analysis if no AI key
    return NextResponse.json(ruleBasedAnalysis, { status: 200 });
  } catch (error) {
    console.error('AI task routing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Enhance rule-based analysis with Claude AI insights
 */
async function enhanceWithClaude(taskText: string, baseAnalysis: any): Promise<any> {
  const prompt = `
    You are an AI assistant for TaskPlanner, a task management application.

    Given the task: "${taskText}"

    And the preliminary analysis:
    - Priority: ${baseAnalysis.priority}
    - Tags: ${baseAnalysis.tags.join(', ')}
    - Deadline: ${baseAnalysis.deadline || 'None'}
    - Context: ${baseAnalysis.context}
    - Reasoning: ${baseAnalysis.causalAnalysis}

    Please provide an enhanced analysis with:
    1. More nuanced priority assessment (considering energy levels, context switching costs)
    2. Additional relevant tags based on semantic understanding
    3. Better deadline estimation if implicit timeframes exist
    4. Deeper contextual understanding (project phase, dependencies, etc.)
    5. Actionable insights and suggestions

    Respond in the same JSON format but with enhanced insights:
  `;

  const msg = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 500,
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }]
  });

  // Parse Claude's response
  const content = msg.content[0].text;
  if(typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (parseError) {
      console.warn('Failed to parse Claude response as JSON:', parseError);
      return baseAnalysis;
    }
  }

  return content || baseAnalysis;
}
import { NextRequest, NextResponse } from 'next/server';
import { AIMonitoringService } from '@/lib/monitoring/ai-monitoring.service';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { interactionId, userId, rating, feedbackText, wasHelpful } = body;
    
    const monitoringService = AIMonitoringService;
    await monitoringService.logUserFeedback({
      interactionId,
      userId,
      rating,
      feedbackText,
      wasHelpful
    });
    
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

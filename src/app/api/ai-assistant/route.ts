import { NextRequest, NextResponse } from 'next/server';
import { AIMonitoringService } from '@/lib/monitoring/ai-monitoring.service';
import { AIAssistantSchema } from '@/lib/validations';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const result = AIAssistantSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const monitoringService = AIMonitoringService;
    const startTime = Date.now();
    
    // Process the AI assistant logic
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({ 
      success: true, 
      data: { responseTime }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

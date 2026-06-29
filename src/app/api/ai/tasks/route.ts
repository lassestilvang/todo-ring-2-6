import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { parseNaturalLanguage } from '@/lib/nlp';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    // Parse task from natural language
    const parsed = parseNaturalLanguage(content);

    // Here would normally save to database
    // In a real app: await saveTask(parsed);

    return NextResponse.json({
      success: true,
      data: parsed
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
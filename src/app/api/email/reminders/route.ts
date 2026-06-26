import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
  try {
    const { apiKey, provider = 'resend' } = await _req.json();

    // Store email settings (in production, save to database)
    if (apiKey && provider) {
      process.env.RESEND_API_KEY = apiKey;
    }

    return NextResponse.json({ success: true, message: 'Email settings saved' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save email settings' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if email reminders are configured
    const hasApiKey = !!process.env.RESEND_API_KEY;

    return NextResponse.json({
      success: true,
      data: {
        configured: hasApiKey,
        provider: process.env.RESEND_API_KEY ? 'resend' : null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check email settings' },
      { status: 500 }
    );
  }
}
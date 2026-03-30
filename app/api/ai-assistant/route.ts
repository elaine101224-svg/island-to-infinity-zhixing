import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/anthropic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await generateAIResponse(message, conversationHistory || []);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Assistant error:', error);

    if (error instanceof Error && error.message.includes('AI service')) {
      return NextResponse.json(
        { error: 'AI service is not configured. Please set ANTHROPIC_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}

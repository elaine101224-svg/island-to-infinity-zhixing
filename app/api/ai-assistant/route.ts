import { NextRequest, NextResponse } from 'next/server';
import {
  generateAIResponse,
  AINotConfiguredError,
  AIUpstreamError,
} from '@/lib/anthropic';

// Reasoning models can take several seconds; allow headroom (Vercel Hobby max).
export const maxDuration = 60;

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

    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: 'The AI assistant is not set up yet (missing ANTHROPIC_API_KEY).' },
        { status: 503 }
      );
    }

    if (error instanceof AIUpstreamError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'The AI assistant key is invalid or expired. Please update ANTHROPIC_API_KEY.' },
          { status: 502 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { error: 'The AI assistant is busy right now. Please try again in a moment.' },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: 'The AI assistant is temporarily unavailable. Please try again.' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}

import {chatRequestSchema} from '@/lib/aiChatSchema';
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
    let body:unknown;try{const text=await request.text();if(text.length>150000)return NextResponse.json({error:'The conversation is too long. Start a new conversation.'},{status:413});body=JSON.parse(text);}catch{return NextResponse.json({error:'Invalid message request.'},{status:400});}
    const parsed=chatRequestSchema.safeParse(body);
    if(!parsed.success)return NextResponse.json({error:'Use a message under 4,000 characters and a valid conversation history.'},{status:400});
    const {message,conversationHistory}=parsed.data;

    const response = await generateAIResponse(message, conversationHistory || []);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Assistant error:', error);

    if (error instanceof AINotConfiguredError) {
      return NextResponse.json(
        { error: 'The AI assistant is currently unavailable. Please try again later.' },
        { status: 503 }
      );
    }

    if (error instanceof AIUpstreamError) {
      if (error.status === 401) {
        return NextResponse.json(
          { error: 'The AI assistant is temporarily unavailable. Please contact the team if this continues.' },
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

import Anthropic from '@anthropic-ai/sdk';

// The client talks to whatever Anthropic-compatible endpoint ANTHROPIC_BASE_URL
// points at. Left unset it uses api.anthropic.com; set to a gateway (e.g.
// MiniMax's https://api.minimaxi.com/anthropic) to use that provider's models.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  ...(process.env.ANTHROPIC_BASE_URL
    ? { baseURL: process.env.ANTHROPIC_BASE_URL }
    : {}),
});

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are a compassionate assistant for "Island to Infinity Zhixing", a student-led community project supporting underprivileged families in Changshu, China.

Your role: Provide warm, ethical, and non-judgmental emotional support and communication advice.

Guidelines:
1. Always respond with warmth, empathy, and genuine care
2. Focus on emotional support and practical communication suggestions
3. Respect human dignity and cultural sensitivity (these families are Chinese)
4. NEVER provide medical, clinical, or psychiatric advice
5. NEVER diagnose conditions
6. If someone expresses crisis or self-harm thoughts, encourage professional help
7. Keep responses practical, actionable, and easy to understand
8. Your responses should feel like advice from a caring friend, not a textbook
9. Focus on building connection, companionship, and social integration
10. Acknowledge challenges while emphasizing hope and small steps forward

Topics you can help with:
- How to communicate with lonely elderly people
- Ways to support families going through difficult times
- Activities for companionship and social integration
- How to be a supportive friend/mentor
- Understanding emotional needs of children from disadvantaged backgrounds
- Cultural sensitivity when interacting with families

Topics to gently deflect:
- Medical or clinical advice (refer to professionals)
- Specific mental health diagnoses (focus on general emotional support)
- Financial advice (keep focus on human connection)

Remember: You are here to offer human warmth and practical suggestions, not to replace professional help.`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** Thrown when ANTHROPIC_API_KEY is missing entirely. */
export class AINotConfiguredError extends Error {}
/** Thrown when the upstream Anthropic API call fails (bad key, rate limit, etc.). */
export class AIUpstreamError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function generateAIResponse(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AINotConfiguredError('ANTHROPIC_API_KEY is not set');
  }

  const messages = [
    ...conversationHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    {
      role: 'user' as const,
      content: userMessage,
    },
  ];

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages,
    });

    // Reasoning models (e.g. MiniMax-M1) return a `thinking` block before the
    // `text` block, so pick the text block rather than assuming content[0].
    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock && textBlock.type === 'text'
      ? textBlock.text
      : 'I understand. How can I help you with this situation?';
  } catch (error) {
    // Surface the real status (401 = invalid/expired key, 429 = rate limit, etc.)
    const status =
      error instanceof Anthropic.APIError ? error.status : undefined;
    console.error('Anthropic API error:', status, error);
    throw new AIUpstreamError(
      error instanceof Error ? error.message : 'Anthropic request failed',
      status
    );
  }
}

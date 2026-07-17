import { NextResponse } from 'next/server';
import { createSession, checkLoginRate } from '@/lib/auth';

const LOGIN_RATE_KEY = 'global';

export async function POST(request: Request) {
  // Cheap per-process rate limit — prevents trivial brute-force loops.
  if (!checkLoginRate(LOGIN_RATE_KEY)) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again in a minute.' },
      { status: 429 }
    );
  }

  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const sessionId = await createSession(password);

    if (!sessionId) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

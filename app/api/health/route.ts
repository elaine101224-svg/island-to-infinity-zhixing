import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const APP_START = Date.now();

/**
 * Health checks.
 *
 *   GET /api/health            -> readiness (env + Supabase probe)
 *   GET /api/health?mode=live  -> liveness (process is up)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') ?? 'ready';

  if (mode === 'live') {
    return NextResponse.json({ status: 'live', uptimeMs: Date.now() - APP_START });
  }

  const checks: Record<string, { ok: boolean; detail?: string }> = {};
  const requiredEnv = ['ADMIN_PASSWORD', 'NEXT_PUBLIC_SUPABASE_URL'];
  const missing = requiredEnv.filter((name) => !process.env[name]);
  checks.env = {
    ok: missing.length === 0,
    detail: missing.length ? `missing: ${missing.join(',')}` : undefined,
  };

  try {
    const started = Date.now();
    const { error } = await supabase
      .from('families')
      .select('id', { count: 'exact', head: true });
    if (error) throw error;
    checks.supabase = { ok: true, detail: `ms=${Date.now() - started}` };
  } catch (err) {
    checks.supabase = { ok: false, detail: err instanceof Error ? err.message : 'unknown' };
    log.warn('health: supabase probe failed', { detail: checks.supabase.detail });
  }

  const ok = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    { status: ok ? 'ready' : 'degraded', uptimeMs: Date.now() - APP_START, checks },
    { status: ok ? 200 : 503 }
  );
}

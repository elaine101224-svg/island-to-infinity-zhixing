import { NextRequest, NextResponse } from 'next/server';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import { validateSession } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { getRequestId } from '@/lib/requestId';
import { log } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Production target is Supabase Storage + signed URLs. While running on a
// single-process serverless deployment we write to a local directory that the
// /api/uploads/[file] route streams back to the browser. Swap to
// supabase.storage.from('photos').upload(...) when scaling.
const UPLOAD_DIR = path.join(process.cwd(), '.uploads');
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function jsonError(requestId: string, status: number, error: string) {
  return NextResponse.json({ error, requestId }, { status });
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);

  if (!(await validateSession())) {
    return jsonError(requestId, 401, 'Unauthorized');
  }
  const csrf = await verifyCsrf(request);
  if (csrf) {
    log.warn('upload.csrf_rejected', { requestId, reason: csrf });
    return jsonError(requestId, 403, csrf);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(requestId, 400, 'Invalid multipart form data');
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return jsonError(requestId, 400, 'Missing file field');
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return jsonError(requestId, 415, `Unsupported mime type: ${file.type}`);
  }

  if (file.size > MAX_BYTES) {
    return jsonError(requestId, 413, `File too large (max ${MAX_BYTES} bytes)`);
  }
  if (file.size === 0) {
    return jsonError(requestId, 400, 'Empty file');
  }

  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    const id = randomBytes(16).toString('hex');
    const ext = EXT_BY_MIME[file.type] ?? 'bin';
    const filename = `${id}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);

    return NextResponse.json(
      {
        url: `/api/uploads/${filename}`,
        mime: file.type,
        size: file.size,
        filename,
      },
      { status: 201 }
    );
  } catch (err) {
    log.error('upload.write_failed', { requestId, error: err instanceof Error ? err.message : 'unknown' });
    return jsonError(requestId, 500, 'Failed to store upload');
  }
}

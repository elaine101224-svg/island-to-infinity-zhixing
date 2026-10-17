import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { validateSession } from '@/lib/auth';
import { verifyCsrf } from '@/lib/csrf';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  if (!(await validateSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const csrf = await verifyCsrf(request);
  if (csrf) return NextResponse.json({ error: csrf }, { status: 403 });
  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: 'Invalid multipart form data' }, { status: 400 }); }
  const file = form.get('file');
  if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Choose a photo' }, { status: 400 });
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return NextResponse.json({ error: 'Use JPEG, PNG or WebP' }, { status: 415 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: 'Maximum upload size is 4 MB. Resize your photo first.' }, { status: 413 });
  let buffer: Buffer;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const meta = await sharp(input, { limitInputPixels: 40000000 }).metadata();
    if (!['jpeg','png','webp'].includes(meta.format || '') || (meta.pages || 1) > 1) throw new Error();
    // rotate honors EXIF, then WebP output strips metadata. fit inside never crops.
    buffer = await sharp(input, { limitInputPixels: 40000000 }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch { return NextResponse.json({ error: 'Invalid, animated or oversized image dimensions' }, { status: 415 }); }
  const filename = `${randomBytes(16).toString('hex')}.webp`;
  const { error } = await supabase.storage.from('photos').upload(filename, buffer, { contentType: 'image/webp', upsert: false });
  if (error) return NextResponse.json({ error: 'Photo could not be stored. Please retry.' }, { status: 503 });
  return NextResponse.json({ url: `/api/uploads/${filename}`, filename, mime: 'image/webp', size: buffer.length }, { status: 201 });
}

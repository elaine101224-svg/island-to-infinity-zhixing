import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UPLOAD_DIR = path.join(process.cwd(), '.uploads');
const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

// Allow only opaque random ids + a small set of image extensions, so a caller
// cannot escape the upload directory (e.g. via "../" or absolute paths).
const SAFE_NAME = /^[a-f0-9]{16,64}\.(jpg|jpeg|png|webp|gif)$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  if (!file || !SAFE_NAME.test(file)) {
    return NextResponse.json({ error: 'Invalid file id' }, { status: 400 });
  }

  const fullPath = path.join(UPLOAD_DIR, file);

  try {
    const info = await stat(fullPath);
    if (!info.isFile()) {
      return NextResponse.json({ error: 'Not a file' }, { status: 404 });
    }
    const buffer = await readFile(fullPath);
    const ext = path.extname(file).slice(1).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';

    // Build a weak ETag from size + mtime for cheap conditional responses.
    const etag = `W/"${info.size.toString(36)}-${Math.floor(info.mtimeMs).toString(36)}"`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': info.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
        ETag: etag,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}

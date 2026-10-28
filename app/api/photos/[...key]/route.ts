import { readPhoto } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const contentTypeFor = (key: string) => {
  const extension = key.split('.').at(-1)?.toLowerCase();
  return ({
    avif: 'image/avif',
    gif: 'image/gif',
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    webp: 'image/webp',
  } as Record<string, string>)[extension ?? ''] ?? 'application/octet-stream';
};

export async function GET(_request: Request, context: { params: Promise<{ key: string[] }> }) {
  const key = (await context.params).key.join('/');
  try {
    const contents = await readPhoto(key);
    return new Response(new Uint8Array(contents), {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': contentTypeFor(key),
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

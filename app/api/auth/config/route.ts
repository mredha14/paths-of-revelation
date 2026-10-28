import { getSupabasePublicConfig } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json(getSupabasePublicConfig());
  } catch {
    return Response.json({ error: 'Authentication is not configured.' }, { status: 503 });
  }
}

import { getSupabasePublicConfig } from '@/lib/supabase';
export async function GET() { return Response.json(getSupabasePublicConfig()); }

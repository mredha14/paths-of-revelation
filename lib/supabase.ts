import { createClient } from '@supabase/supabase-js';
import { env } from 'cloudflare:workers';

type RuntimeEnv = Record<string, string | undefined>;
const runtime = env as unknown as RuntimeEnv;

export function getSupabaseAdmin() {
  const url = runtime.SUPABASE_URL;
  const key = runtime.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function getSupabasePublicConfig() {
  const url = runtime.SUPABASE_URL;
  const anonKey = runtime.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase is not configured.');
  return { url, anonKey };
}

export async function requireSupabaseUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  const allowed = (runtime.ADMIN_EMAIL_ALLOWLIST ?? '').split(',').map((email) => email.trim().toLowerCase());
  return { user: data.user, role: data.user.email && allowed.includes(data.user.email.toLowerCase()) ? 'admin' : 'member' };
}

import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function getSupabasePublicConfig() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Supabase is not configured.');
  return { url, anonKey };
}

export async function requireSupabaseUser(request: Request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) return null;
  const allowed = (process.env.ADMIN_EMAIL_ALLOWLIST ?? '').split(',').map((email) => email.trim().toLowerCase());
  const role: 'admin' | 'member' = data.user.email && allowed.includes(data.user.email.toLowerCase()) ? 'admin' : 'member';
  return { user: data.user, role };
}

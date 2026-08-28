import { getDb } from '@/db';
import { profiles } from '@/db/schema';
import { requireSupabaseUser } from '@/lib/supabase';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const identity = await requireSupabaseUser(request);
  if (!identity) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const username = String(identity.user.user_metadata.username ?? identity.user.email?.split('@')[0] ?? 'member').slice(0, 48);
  const current = await db.select().from(profiles).where(eq(profiles.authSubject, identity.user.id)).get();
  const profile = current ?? (await db.insert(profiles).values({ authSubject: identity.user.id, username, displayName: username, role: identity.role, createdAt: new Date() }).returning())[0];
  return Response.json({ id: profile.id, username: profile.username, role: identity.role, email: identity.user.email });
}

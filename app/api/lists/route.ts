import { getDb } from '@/db';
import { itineraries, itineraryStops, profiles } from '@/db/schema';
import { requireSupabaseUser } from '@/lib/supabase';
import { eq } from 'drizzle-orm';

async function profileFor(request: Request) {
  const identity = await requireSupabaseUser(request);
  if (!identity) return null;
  const db = getDb();
  const found = await db.select().from(profiles).where(eq(profiles.authSubject, identity.user.id)).get();
  return found ? { db, profile: found } : null;
}

export async function GET(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const lists = await current.db.select().from(itineraries).where(eq(itineraries.profileId, current.profile.id)).all();
  return Response.json(lists);
}

export async function POST(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const body = await request.json() as { title?: string; placeId?: number };
  if (!body.title?.trim()) return Response.json({ error: 'A list name is required.' }, { status: 400 });
  const now = new Date();
  const token = crypto.randomUUID().replace(/-/g, '');
  const [list] = await current.db.insert(itineraries).values({ profileId: current.profile.id, title: body.title.trim(), shareToken: token, isPublic: true, createdAt: now, updatedAt: now }).returning();
  if (body.placeId) await current.db.insert(itineraryStops).values({ itineraryId: list.id, placeId: body.placeId, dayNumber: 1, position: 0 });
  return Response.json(list);
}

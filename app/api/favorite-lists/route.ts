import { asc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { favoriteListPlaces, favoriteLists, profiles } from '@/db/schema';
import { requireSupabaseUser } from '@/lib/supabase';

async function profileFor(request: Request) {
  const identity = await requireSupabaseUser(request);
  if (!identity) return null;
  const db = getDb();
  const profile = await db.select().from(profiles).where(eq(profiles.authSubject, identity.user.id)).get();
  return profile ? { db, profile } : null;
}

export async function GET(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const lists = await current.db.select().from(favoriteLists)
    .where(eq(favoriteLists.profileId, current.profile.id)).orderBy(asc(favoriteLists.createdAt)).all();
  const ids = lists.map((list) => list.id);
  const saved = ids.length
    ? await current.db.select().from(favoriteListPlaces).where(inArray(favoriteListPlaces.favoriteListId, ids)).all()
    : [];
  return Response.json(lists.map((list) => ({
    ...list,
    placeIds: saved.filter((item) => item.favoriteListId === list.id).map((item) => item.placeId),
  })));
}

export async function POST(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const body = await request.json() as { title?: string };
  const title = body.title?.trim();
  if (!title) return Response.json({ error: 'A list name is required.' }, { status: 400 });
  if (title.length > 80) return Response.json({ error: 'List names must be 80 characters or fewer.' }, { status: 400 });
  const now = new Date();
  const [list] = await current.db.insert(favoriteLists).values({ profileId: current.profile.id, title, createdAt: now, updatedAt: now }).returning();
  return Response.json({ ...list, placeIds: [] });
}

export async function DELETE(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const body = await request.json() as { id?: number };
  if (!Number.isInteger(body.id)) return Response.json({ error: 'Invalid favorite list.' }, { status: 400 });
  const list = await current.db.select().from(favoriteLists)
    .where(eq(favoriteLists.id, body.id)).get();
  if (!list || list.profileId !== current.profile.id) return Response.json({ error: 'Favorite list not found.' }, { status: 404 });
  await current.db.delete(favoriteLists).where(eq(favoriteLists.id, list.id));
  return Response.json({ ok: true });
}

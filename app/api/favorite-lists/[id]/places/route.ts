import { and, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { favoriteListPlaces, favoriteLists, profiles } from '@/db/schema';
import { requireSupabaseUser } from '@/lib/supabase';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const identity = await requireSupabaseUser(request);
  if (!identity) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const id = Number((await context.params).id);
  const body = await request.json() as { placeId?: number };
  if (!Number.isInteger(id) || !Number.isInteger(body.placeId)) return Response.json({ error: 'Invalid favorite list.' }, { status: 400 });
  const db = getDb();
  const profile = await db.select().from(profiles).where(eq(profiles.authSubject, identity.user.id)).get();
  if (!profile) return Response.json({ error: 'Profile not found.' }, { status: 404 });
  const list = await db.select().from(favoriteLists).where(and(eq(favoriteLists.id, id), eq(favoriteLists.profileId, profile.id))).get();
  if (!list) return Response.json({ error: 'Favorite list not found.' }, { status: 404 });
  await db.insert(favoriteListPlaces).values({ favoriteListId: id, placeId: body.placeId, createdAt: new Date() }).onConflictDoNothing();
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const identity = await requireSupabaseUser(request);
  if (!identity) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const id = Number((await context.params).id);
  const body = await request.json() as { placeId?: number };
  if (!Number.isInteger(id) || !Number.isInteger(body.placeId)) return Response.json({ error: 'Invalid favorite list.' }, { status: 400 });
  const db = getDb();
  const profile = await db.select().from(profiles).where(eq(profiles.authSubject, identity.user.id)).get();
  if (!profile) return Response.json({ error: 'Profile not found.' }, { status: 404 });
  const list = await db.select().from(favoriteLists).where(and(eq(favoriteLists.id, id), eq(favoriteLists.profileId, profile.id))).get();
  if (!list) return Response.json({ error: 'Favorite list not found.' }, { status: 404 });
  await db.delete(favoriteListPlaces).where(and(eq(favoriteListPlaces.favoriteListId, id), eq(favoriteListPlaces.placeId, body.placeId)));
  return Response.json({ ok: true });
}

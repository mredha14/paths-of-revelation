import { nextId, readStore, updateStore } from '@/lib/store';
import { requireSupabaseUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function profileFor(request: Request) {
  const identity = await requireSupabaseUser(request);
  if (!identity) return null;
  const store = await readStore();
  const profile = store.profiles.find((item) => item.authSubject === identity.user.id);
  return profile ? { profile } : null;
}

export async function GET(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const store = await readStore();
  return Response.json(store.favoriteLists
    .filter((list) => list.profileId === current.profile.id)
    .sort((a, b) => a.createdAt - b.createdAt));
}

export async function POST(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const body = await request.json() as { title?: string };
  const title = body.title?.trim();
  if (!title) return Response.json({ error: 'A list name is required.' }, { status: 400 });
  if (title.length > 80) return Response.json({ error: 'List names must be 80 characters or fewer.' }, { status: 400 });
  const now = Date.now();
  const list = await updateStore((store) => {
    const created = {
      id: nextId(store, 'favoriteList'),
      profileId: current.profile.id,
      title,
      placeIds: [],
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };
    store.favoriteLists.push(created);
    return structuredClone(created);
  });
  return Response.json({ ...list, placeIds: [] });
}

export async function DELETE(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const body = await request.json() as { id?: number };
  if (!Number.isInteger(body.id)) return Response.json({ error: 'Invalid favorite list.' }, { status: 400 });
  const deleted = await updateStore((store) => {
    const index = store.favoriteLists.findIndex((list) => list.id === body.id && list.profileId === current.profile.id);
    if (index === -1) return false;
    store.favoriteLists.splice(index, 1);
    return true;
  });
  if (!deleted) return Response.json({ error: 'Favorite list not found.' }, { status: 404 });
  return Response.json({ ok: true });
}

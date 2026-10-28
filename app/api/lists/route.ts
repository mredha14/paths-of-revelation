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
  return Response.json(store.itineraries.filter((list) => list.profileId === current.profile.id));
}

export async function POST(request: Request) {
  const current = await profileFor(request);
  if (!current) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const body = await request.json() as { title?: string; placeId?: number };
  if (!body.title?.trim()) return Response.json({ error: 'A list name is required.' }, { status: 400 });
  const now = Date.now();
  const token = crypto.randomUUID().replace(/-/g, '');
  const list = await updateStore((store) => {
    const created = {
      id: nextId(store, 'itinerary'),
      profileId: current.profile.id,
      title: body.title!.trim(),
      shareToken: token,
      isPublic: true,
      createdAt: now,
      updatedAt: now,
    };
    store.itineraries.push(created);
    if (body.placeId) {
      store.itineraryStops.push({
        id: nextId(store, 'itineraryStop'),
        itineraryId: created.id,
        placeId: body.placeId,
        dayNumber: 1,
        position: 0,
      });
    }
    return structuredClone(created);
  });
  return Response.json(list);
}

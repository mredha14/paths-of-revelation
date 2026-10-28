import { readStore, updateStore } from '@/lib/store';
import { requireSupabaseUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const identity = await requireSupabaseUser(request);
  if (!identity) return Response.json({ error: 'Sign in required.' }, { status: 401 });
  const id = Number((await context.params).id);
  if (!Number.isInteger(id)) return Response.json({ error: 'Invalid favorite list.' }, { status: 400 });
  const storeSnapshot = await readStore();
  const profile = storeSnapshot.profiles.find((item) => item.authSubject === identity.user.id);
  if (!profile) return Response.json({ error: 'Profile not found.' }, { status: 404 });
  const list = storeSnapshot.favoriteLists.find((item) => item.id === id && item.profileId === profile.id);
  if (!list) return Response.json({ error: 'Favorite list not found.' }, { status: 404 });
  const shareToken = list.shareToken ?? crypto.randomUUID().replaceAll('-', '');
  await updateStore((store) => {
    const current = store.favoriteLists.find((item) => item.id === id && item.profileId === profile.id);
    if (current) {
      current.isPublic = true;
      current.shareToken = shareToken;
      current.updatedAt = Date.now();
    }
  });
  return Response.json({ shareToken });
}

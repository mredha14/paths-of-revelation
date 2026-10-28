import { nextId, readStore, slugify, updateStore, type StoreData } from '@/lib/store';
import { requireSupabaseUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const collectionFor = (store: StoreData, kind: string) =>
  kind === 'cities' ? store.cities : kind === 'categories' ? store.categories : null;
async function admin(request: Request) { const user = await requireSupabaseUser(request); return user?.role === 'admin'; }

export async function GET(request: Request) {
  if (!await admin(request)) return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const store = await readStore();
  return Response.json({ cities: store.cities, categories: store.categories });
}

export async function POST(request: Request) {
  if (!await admin(request)) return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const body = await request.json() as { kind?: string; nameAr?: string; nameEn?: string };
  const nameAr = body.nameAr?.trim(); const nameEn = body.nameEn?.trim();
  if (!body.kind || !nameAr || !nameEn) return Response.json({ error: 'Arabic and English names are required.' }, { status: 400 });
  try {
    const created = await updateStore((store) => {
      const collection = collectionFor(store, body.kind!);
      if (!collection) throw new Error('Invalid taxonomy type.');
      const slug = slugify(nameEn);
      if (collection.some((item) => item.slug === slug)) throw new Error('Duplicate taxonomy item.');
      const item = {
        id: nextId(store, body.kind === 'cities' ? 'city' : 'category'),
        slug,
        nameAr,
        nameEn,
        createdAt: Date.now(),
      };
      collection.push(item);
      return item;
    });
    return Response.json(created);
  }
  catch { return Response.json({ error: 'This name is already in use. Choose another English name.' }, { status: 409 }); }
}

export async function PUT(request: Request) {
  if (!await admin(request)) return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const body = await request.json() as { kind?: string; id?: number; nameAr?: string; nameEn?: string };
  const nameAr = body.nameAr?.trim(); const nameEn = body.nameEn?.trim();
  if (!body.kind || !Number.isInteger(body.id) || !nameAr || !nameEn) return Response.json({ error: 'Complete all required fields.' }, { status: 400 });
  const found = await updateStore((store) => {
    const collection = collectionFor(store, body.kind!);
    const item = collection?.find((candidate) => candidate.id === body.id);
    if (!item) return false;
    item.nameAr = nameAr;
    item.nameEn = nameEn;
    return true;
  });
  if (!found) return Response.json({ error: 'Taxonomy item not found.' }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!await admin(request)) return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const body = await request.json() as { kind?: string; id?: number; slug?: string };
  if (!body.kind || !Number.isInteger(body.id) || !body.slug) return Response.json({ error: 'Invalid item.' }, { status: 400 });
  const result = await updateStore((store) => {
    const collection = collectionFor(store, body.kind!);
    if (!collection) return 'missing';
    const used = store.places.some((place) => body.kind === 'cities' ? place.city === body.slug : place.typeEn === body.slug);
    if (used) return 'used';
    const index = collection.findIndex((item) => item.id === body.id);
    if (index === -1) return 'missing';
    collection.splice(index, 1);
    return 'deleted';
  });
  if (result === 'used') return Response.json({ error: 'This item is used by existing places and cannot be deleted.' }, { status: 400 });
  if (result === 'missing') return Response.json({ error: 'Taxonomy item not found.' }, { status: 404 });
  return Response.json({ ok: true });
}

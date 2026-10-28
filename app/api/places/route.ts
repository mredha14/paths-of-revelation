import {
  deletePhoto,
  nextId,
  readStore,
  savePhoto,
  slugify,
  toPlaceDto,
  updateStore,
} from '@/lib/store';
import { requireSupabaseUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const store = await readStore();
  return Response.json(store.places
    .filter((place) => place.status === 'published')
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(toPlaceDto));
}

export async function POST(request: Request) {
  const user = await requireSupabaseUser(request);
  if (user?.role !== 'admin') return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const form = await request.formData();
  const title = String(form.get('title') ?? '');
  const titleEn = String(form.get('titleEn') ?? '');
  const description = String(form.get('description') ?? '');
  const descriptionEn = String(form.get('descriptionEn') ?? '');
  const categorySlug = String(form.get('category') ?? '');
  const citySlug = String(form.get('city') ?? '');
  const lat = Number(form.get('lat'));
  const lng = Number(form.get('lng'));
  const photo = form.get('photo');
  if (!title || !titleEn || !description || !descriptionEn || !categorySlug || !citySlug ||
      !Number.isFinite(lat) || !Number.isFinite(lng) || !(photo instanceof File) ||
      !photo.type.startsWith('image/') || photo.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'Complete all fields and upload an image smaller than 5 MB.' }, { status: 400 });
  }

  const key = await savePhoto(
    `places/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`,
    await photo.arrayBuffer(),
  );
  try {
    const created = await updateStore((store) => {
      const city = store.cities.find((item) => item.slug === citySlug);
      const category = store.categories.find((item) => item.slug === categorySlug);
      if (!city || !category) throw new Error('Choose an existing city and category.');
      const now = Date.now();
      const place = {
        id: nextId(store, 'place'),
        slug: `${citySlug}-${slugify(titleEn)}-${now}`,
        city: citySlug,
        cityAr: city.nameAr,
        title,
        titleEn,
        type: category.nameAr,
        typeEn: category.nameEn,
        era: '',
        eraEn: '',
        description,
        descriptionEn,
        lat,
        lng,
        photoKey: key,
        status: 'published' as const,
        createdAt: now,
        updatedAt: now,
      };
      store.places.push(place);
      return toPlaceDto(place);
    });
    return Response.json(created);
  } catch (error) {
    await deletePhoto(key);
    return Response.json({ error: error instanceof Error ? error.message : 'Could not save this place.' }, { status: 400 });
  }
}

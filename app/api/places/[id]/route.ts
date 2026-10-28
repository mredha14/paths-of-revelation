import { deletePhoto, savePhoto, updateStore } from '@/lib/store';
import { requireSupabaseUser } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireSupabaseUser(request);
  if (user?.role !== 'admin') return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const id = Number((await context.params).id);
  const photoKey = await updateStore((store) => {
    const index = store.places.findIndex((place) => place.id === id);
    if (index === -1) return null;
    const [removed] = store.places.splice(index, 1);
    for (const list of store.favoriteLists) list.placeIds = list.placeIds.filter((placeId) => placeId !== id);
    store.itineraryStops = store.itineraryStops.filter((stop) => stop.placeId !== id);
    return removed.photoKey;
  });
  await deletePhoto(photoKey);
  return photoKey === null && !Number.isFinite(id)
    ? Response.json({ error: 'Invalid place.' }, { status: 400 })
    : Response.json({ ok: true });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await requireSupabaseUser(request);
  if (user?.role !== 'admin') return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const id = Number((await context.params).id);
  const form = await request.formData();
  const title = String(form.get('title') ?? '');
  const titleEn = String(form.get('titleEn') ?? '');
  const description = String(form.get('description') ?? '');
  const descriptionEn = String(form.get('descriptionEn') ?? '');
  const citySlug = String(form.get('city') ?? '');
  const categorySlug = String(form.get('category') ?? '');
  const lat = Number(form.get('lat'));
  const lng = Number(form.get('lng'));
  const photo = form.get('photo');
  if (!title || !titleEn || !description || !descriptionEn || !citySlug || !categorySlug ||
      !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return Response.json({ error: 'Complete all required fields and valid GPS coordinates.' }, { status: 400 });
  }
  if (photo instanceof File && photo.size && (!photo.type.startsWith('image/') || photo.size > 5 * 1024 * 1024)) {
    return Response.json({ error: 'Upload an image smaller than 5 MB.' }, { status: 400 });
  }

  const newKey = photo instanceof File && photo.size
    ? await savePhoto(`places/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`, await photo.arrayBuffer())
    : null;
  try {
    const result = await updateStore((store) => {
      const place = store.places.find((item) => item.id === id);
      const city = store.cities.find((item) => item.slug === citySlug);
      const category = store.categories.find((item) => item.slug === categorySlug);
      if (!place || !city || !category) return { oldKey: null, found: false };
      const oldKey = place.photoKey;
      Object.assign(place, {
        title,
        titleEn,
        description,
        descriptionEn,
        city: citySlug,
        cityAr: city.nameAr,
        type: category.nameAr,
        typeEn: category.nameEn,
        lat,
        lng,
        updatedAt: Date.now(),
      });
      if (newKey) place.photoKey = newKey;
      return { oldKey, found: true };
    });
    if (!result.found) {
      await deletePhoto(newKey);
      return Response.json({ error: 'Place not found.' }, { status: 404 });
    }
    if (newKey) await deletePhoto(result.oldKey);
    return Response.json({ ok: true });
  } catch (error) {
    await deletePhoto(newKey);
    throw error;
  }
}

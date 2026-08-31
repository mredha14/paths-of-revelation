import { eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { categories, cities, favoriteListPlaces, favoriteLists, placePhotos, places } from '@/db/schema';

const labels: Record<string, { ar: string; en: string }> = { mosque:{ar:'مسجد',en:'Mosque'},revelation:{ar:'موضع وحي',en:'Revelation site'},mountain:{ar:'جبل أو معلم طبيعي',en:'Mountain / landmark'},historic_site:{ar:'موقع تاريخي',en:'Historic site'},route:{ar:'طريق أو مسار',en:'Route'},residence:{ar:'منزل أو إقامة',en:'Residence'},cemetery:{ar:'مقبرة',en:'Cemetery'} };
const photoUrl = (key?: string | null) => key ? `/api/photos/${key.split('/').map(encodeURIComponent).join('/')}` : 'https://images.unsplash.com/photo-1565552645890-46e7e38a0c30?auto=format&fit=crop&w=1000&q=80';

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const token = (await context.params).token;
  const db = getDb();
  const list = await db.select().from(favoriteLists).where(eq(favoriteLists.shareToken, token)).get();
  if (!list || !list.isPublic) return Response.json({ error: 'This favorite list is unavailable.' }, { status: 404 });
  const saved = await db.select().from(favoriteListPlaces).where(eq(favoriteListPlaces.favoriteListId, list.id)).all();
  const ids = saved.map((item) => item.placeId);
  const records = ids.length ? await db.select().from(places).where(inArray(places.id, ids)).all() : [];
  const photos = ids.length ? await db.select().from(placePhotos).where(inArray(placePhotos.placeId, ids)).all() : [];
  const cityRows = await db.select().from(cities).all();
  const categoryRows = await db.select().from(categories).all();
  const byId = new Map(records.map((place) => [place.id, place]));
  return Response.json({
    title: list.title,
    places: ids.flatMap((id) => {
      const place = byId.get(id);
      if (!place || place.status !== 'published') return [];
      const photo = photos.find((item) => item.placeId === id)?.objectKey;
      const city = cityRows.find((item) => item.slug === place.city);
      const category = categoryRows.find((item) => item.slug === place.category);
      return [{ id: place.id, city: city?.nameEn ?? (place.city === 'makkah' ? 'Makkah' : place.city === 'madinah' ? 'Madinah' : place.city), cityAr: city?.nameAr ?? (place.city === 'makkah' ? 'مكة المكرمة' : place.city === 'madinah' ? 'المدينة المنورة' : place.city), title: place.titleAr, titleEn: place.titleEn, type: category?.nameAr ?? labels[place.category]?.ar ?? place.category, typeEn: category?.nameEn ?? labels[place.category]?.en ?? place.category, era: place.era ?? '', eraEn: place.era ?? '', description: place.descriptionAr, descriptionEn: place.descriptionEn, lat: Number(place.latitude), lng: Number(place.longitude), photo: photoUrl(photo) }];
    }),
  });
}

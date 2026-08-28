import { getDb } from '@/db';
import { placePhotos, places } from '@/db/schema';
import { requireSupabaseUser } from '@/lib/supabase';

type NewPlace = { city: 'Makkah' | 'Madinah'; title: string; titleEn: string; description: string; descriptionEn: string; category: string; lat: number; lng: number; photo: string };

const categoryLabels: Record<string, { ar: string; en: string }> = {
  mosque: { ar: 'مسجد', en: 'Mosque' },
  revelation: { ar: 'موضع وحي', en: 'Revelation site' },
  mountain: { ar: 'جبل أو معلم طبيعي', en: 'Mountain / landmark' },
  historic_site: { ar: 'موقع تاريخي', en: 'Historic site' },
  route: { ar: 'طريق أو مسار', en: 'Route' },
  residence: { ar: 'منزل أو إقامة', en: 'Residence' },
  cemetery: { ar: 'مقبرة', en: 'Cemetery' },
};

export async function POST(request: Request) {
  const identity = await requireSupabaseUser(request);
  if (!identity || identity.role !== 'admin') return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const body = await request.json() as NewPlace;
  if (!body.title || !body.titleEn || !body.description || !body.descriptionEn || !categoryLabels[body.category] || !Number.isFinite(body.lat) || !Number.isFinite(body.lng)) {
    return Response.json({ error: 'Please complete all required place fields.' }, { status: 400 });
  }
  const now = new Date();
  const slug = body.city.toLowerCase() + '-' + body.titleEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
  const labels = categoryLabels[body.category];
  const db = getDb();
  const [created] = await db.insert(places).values({
    slug, city: body.city.toLowerCase() as 'makkah' | 'madinah', latitude: String(body.lat), longitude: String(body.lng),
    titleAr: body.title, titleEn: body.titleEn, descriptionAr: body.description, descriptionEn: body.descriptionEn,
    category: body.category, era: null, sourceUrl: null, sourceLabelAr: 'أضيف من لوحة الإدارة', sourceLabelEn: 'Added from the admin panel',
    status: 'published', createdAt: now, updatedAt: now,
  }).returning();
  if (body.photo.trim()) await db.insert(placePhotos).values({ placeId: created.id, objectKey: body.photo.trim(), altAr: body.title, altEn: body.titleEn, position: 0, createdAt: now });
  return Response.json({ id: created.id, city: body.city, title: body.title, titleEn: body.titleEn, type: labels.ar, typeEn: labels.en, era: 'موقع مضاف حديثاً', eraEn: 'Recently added', description: body.description, descriptionEn: body.descriptionEn, lat: body.lat, lng: body.lng, photo: body.photo.trim() || 'https://images.unsplash.com/photo-1565552645890-46e7e38a0c30?auto=format&fit=crop&w=1000&q=80', source: 'أضيف من لوحة الإدارة' });
}

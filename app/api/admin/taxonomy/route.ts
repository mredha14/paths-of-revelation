import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/db';
import { categories, cities, places } from '@/db/schema';
import { requireSupabaseUser } from '@/lib/supabase';

const tableFor = (kind: string) => kind === 'cities' ? cities : kind === 'categories' ? categories : null;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `item-${crypto.randomUUID().slice(0, 8)}`;
async function admin(request: Request) { const user = await requireSupabaseUser(request); return user?.role === 'admin'; }

export async function GET(request: Request) {
  if (!await admin(request)) return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const db = getDb();
  return Response.json({ cities: await db.select().from(cities).all(), categories: await db.select().from(categories).all() });
}

export async function POST(request: Request) {
  if (!await admin(request)) return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const body = await request.json() as { kind?: string; nameAr?: string; nameEn?: string };
  const table = tableFor(body.kind ?? ''); const nameAr = body.nameAr?.trim(); const nameEn = body.nameEn?.trim();
  if (!table || !nameAr || !nameEn) return Response.json({ error: 'Arabic and English names are required.' }, { status: 400 });
  try { const [created] = await getDb().insert(table).values({ slug: slugify(nameEn), nameAr, nameEn, createdAt: new Date() }).returning(); return Response.json(created); }
  catch { return Response.json({ error: 'This name is already in use. Choose another English name.' }, { status: 409 }); }
}

export async function PUT(request: Request) {
  if (!await admin(request)) return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const body = await request.json() as { kind?: string; id?: number; nameAr?: string; nameEn?: string };
  const table = tableFor(body.kind ?? ''); const nameAr = body.nameAr?.trim(); const nameEn = body.nameEn?.trim();
  if (!table || !Number.isInteger(body.id) || !nameAr || !nameEn) return Response.json({ error: 'Complete all required fields.' }, { status: 400 });
  await getDb().update(table).set({ nameAr, nameEn }).where(eq(table.id, body.id!));
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  if (!await admin(request)) return Response.json({ error: 'Administrator access is required.' }, { status: 403 });
  const body = await request.json() as { kind?: string; id?: number; slug?: string };
  const table = tableFor(body.kind ?? '');
  if (!table || !Number.isInteger(body.id) || !body.slug) return Response.json({ error: 'Invalid item.' }, { status: 400 });
  const field = body.kind === 'cities' ? places.city : places.category;
  const usage = await getDb().select({ count: sql<number>`count(*)` }).from(places).where(eq(field, body.slug)).get();
  if ((usage?.count ?? 0) > 0) return Response.json({ error: 'This item is used by existing places and cannot be deleted.' }, { status: 400 });
  await getDb().delete(table).where(eq(table.id, body.id));
  return Response.json({ ok: true });
}

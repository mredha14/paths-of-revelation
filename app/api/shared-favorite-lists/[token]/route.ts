import { readStore, toPlaceDto } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, context: { params: Promise<{ token: string }> }) {
  const token = (await context.params).token;
  const store = await readStore();
  const list = store.favoriteLists.find((item) => item.shareToken === token);
  if (!list || !list.isPublic) return Response.json({ error: 'This favorite list is unavailable.' }, { status: 404 });
  return Response.json({
    title: list.title,
    places: list.placeIds.flatMap((id) => {
      const place = store.places.find((item) => item.id === id);
      if (!place || place.status !== 'published') return [];
      return [toPlaceDto(place)];
    }),
  });
}

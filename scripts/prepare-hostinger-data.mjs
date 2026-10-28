import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const source = process.env.MIGRATION_SOURCE || 'https://paths-of-revelation.mohammed-redha.chatgpt.site';
const outputDirectory = path.resolve('data');
const uploadDirectory = path.join(outputDirectory, 'seed-assets');
const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const response = await fetch(`${source}/api/places`);
if (!response.ok) throw new Error(`Could not read ${source}/api/places: ${response.status}`);
const livePlaces = await response.json();
if (!Array.isArray(livePlaces) || !livePlaces.length) throw new Error('The source returned no places.');

await mkdir(uploadDirectory, { recursive: true });

const cities = new Map();
const categories = new Map();
const places = [];

for (const [index, live] of livePlaces.entries()) {
  const citySlug = slugify(live.city);
  const categorySlug = slugify(live.typeEn);
  if (!cities.has(citySlug)) cities.set(citySlug, { slug: citySlug, nameAr: live.cityAr, nameEn: live.city });
  if (!categories.has(categorySlug)) categories.set(categorySlug, { slug: categorySlug, nameAr: live.type, nameEn: live.typeEn });

  let photoKey = null;
  if (typeof live.photo === 'string' && live.photo) {
    const photoUrl = new URL(live.photo, source);
    const photoResponse = await fetch(photoUrl);
    if (!photoResponse.ok) throw new Error(`Could not download ${photoUrl}: ${photoResponse.status}`);
    const sourceParts = photoUrl.pathname.split('/').filter(Boolean);
    const apiPhotosIndex = sourceParts.indexOf('photos');
    const fileName = decodeURIComponent(sourceParts.at(-1) || `${crypto.randomUUID()}-place.jpg`);
    photoKey = `places/${fileName}`;
    if (apiPhotosIndex === -1) photoKey = `places/${crypto.randomUUID()}-${fileName}`;
    const destination = path.join(uploadDirectory, photoKey);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, new Uint8Array(await photoResponse.arrayBuffer()));
  }

  const createdAt = Date.now() - index * 1000;
  places.push({
    id: live.id,
    slug: `${citySlug}-${slugify(live.titleEn)}`,
    city: citySlug,
    cityAr: live.cityAr,
    title: live.title,
    titleEn: live.titleEn,
    type: live.type,
    typeEn: live.typeEn,
    era: live.era || '',
    eraEn: live.eraEn || live.era || '',
    description: live.description,
    descriptionEn: live.descriptionEn,
    lat: Number(live.lat),
    lng: Number(live.lng),
    photoKey,
    status: 'published',
    createdAt,
    updatedAt: createdAt,
  });
}

const now = Date.now();
const cityRows = [...cities.values()].map((item, index) => ({ id: index + 1, ...item, createdAt: now }));
const categoryRows = [...categories.values()].map((item, index) => ({ id: index + 1, ...item, createdAt: now }));
const store = {
  version: 1,
  counters: {
    place: Math.max(...places.map((item) => item.id), 0),
    city: cityRows.length,
    category: categoryRows.length,
    profile: 0,
    favoriteList: 0,
    itinerary: 0,
    itineraryStop: 0,
  },
  cities: cityRows,
  categories: categoryRows,
  places,
  profiles: [],
  favoriteLists: [],
  itineraries: [],
  itineraryStops: [],
};

await writeFile(path.join(outputDirectory, 'seed.json'), JSON.stringify(store, null, 2));
console.log(`Imported ${places.length} places, ${cities.size} cities, ${categories.size} categories, and ${places.filter((item) => item.photoKey).length} photos.`);

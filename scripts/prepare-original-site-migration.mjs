import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const source = 'https://paths-of-revelation.mohammed-redha.chatgpt.site';
const output = 'work/original-site-migration-20260923';
const sqlQuote = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const response = await fetch(`${source}/api/places`);
if (!response.ok) throw new Error(`Could not read original places: ${response.status}`);
const places = await response.json();
if (!Array.isArray(places) || places.length === 0) throw new Error('Original site returned no places.');

await mkdir('work', { recursive: true });
await mkdir(output, { recursive: false });
await mkdir(join(output, 'photos'), { recursive: false });
const now = Date.now();
const cities = new Map();
const categories = new Map();
const photos = [];
const placeRows = [];
const photoRows = [];

for (const place of places) {
  const citySlug = slugify(place.city);
  const categorySlug = slugify(place.typeEn);
  cities.set(citySlug, { ar: place.cityAr, en: place.city });
  categories.set(categorySlug, { ar: place.type, en: place.typeEn });

  const photoPath = new URL(place.photo, source).pathname;
  const fileName = photoPath.split('/').at(-1);
  const objectKey = `places/${fileName}`;
  const photoResponse = await fetch(new URL(photoPath, source));
  if (!photoResponse.ok) throw new Error(`Could not download ${photoPath}: ${photoResponse.status}`);
  await writeFile(join(output, 'photos', fileName), Buffer.from(await photoResponse.arrayBuffer()));
  photos.push({ fileName, objectKey, contentType: photoResponse.headers.get('content-type') ?? 'application/octet-stream' });

  placeRows.push(`(${place.id},${sqlQuote(`${citySlug}-${slugify(place.titleEn)}`)},${sqlQuote(citySlug)},${sqlQuote(place.lat)},${sqlQuote(place.lng)},${sqlQuote(place.title)},${sqlQuote(place.titleEn)},${sqlQuote(place.description)},${sqlQuote(place.descriptionEn)},${sqlQuote(categorySlug)},${sqlQuote(place.era || null)},'published',${now},${now})`);
  photoRows.push(`(${place.id},${sqlQuote(objectKey)},${sqlQuote(place.title)},${sqlQuote(place.titleEn)},0,${now})`);
}

const cityRows = [...cities].map(([slug, city]) => `(${sqlQuote(slug)},${sqlQuote(city.ar)},${sqlQuote(city.en)},${now})`);
const categoryRows = [...categories].map(([slug, category]) => `(${sqlQuote(slug)},${sqlQuote(category.ar)},${sqlQuote(category.en)},${now})`);
const sql = [
  'PRAGMA foreign_keys = ON;',
  'DELETE FROM place_photos;',
  'DELETE FROM favorite_list_places;',
  'DELETE FROM favorites;',
  'DELETE FROM itinerary_stops;',
  'DELETE FROM places;',
  'DELETE FROM cities;',
  'DELETE FROM categories;',
  `INSERT INTO cities (slug,name_ar,name_en,created_at) VALUES ${cityRows.join(',')};`,
  `INSERT INTO categories (slug,name_ar,name_en,created_at) VALUES ${categoryRows.join(',')};`,
  `INSERT INTO places (id,slug,city,latitude,longitude,title_ar,title_en,description_ar,description_en,category,era,status,created_at,updated_at) VALUES ${placeRows.join(',')};`,
  `INSERT INTO place_photos (place_id,object_key,alt_ar,alt_en,position,created_at) VALUES ${photoRows.join(',')};`,
].join('\n');

await writeFile(join(output, 'places.sql'), sql);
await writeFile(join(output, 'photos.json'), JSON.stringify(photos, null, 2));
console.log(`Prepared ${places.length} places and ${photos.length} photos in ${output}.`);

import { cp, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type TaxonomyItem = {
  id: number;
  slug: string;
  nameAr: string;
  nameEn: string;
  createdAt: number;
};

export type PlaceRecord = {
  id: number;
  slug: string;
  city: string;
  cityAr: string;
  title: string;
  titleEn: string;
  type: string;
  typeEn: string;
  era: string;
  eraEn: string;
  description: string;
  descriptionEn: string;
  lat: number;
  lng: number;
  photoKey: string | null;
  status: 'draft' | 'review' | 'published';
  createdAt: number;
  updatedAt: number;
};

export type ProfileRecord = {
  id: number;
  authSubject: string;
  username: string;
  displayName: string;
  role: 'member' | 'editor' | 'admin';
  createdAt: number;
};

export type FavoriteListRecord = {
  id: number;
  profileId: number;
  title: string;
  placeIds: number[];
  isPublic: boolean;
  shareToken?: string;
  createdAt: number;
  updatedAt: number;
};

export type ItineraryRecord = {
  id: number;
  profileId: number;
  title: string;
  shareToken: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ItineraryStopRecord = {
  id: number;
  itineraryId: number;
  placeId: number;
  dayNumber: number;
  position: number;
  note?: string;
};

export type StoreData = {
  version: 1;
  counters: {
    place: number;
    city: number;
    category: number;
    profile: number;
    favoriteList: number;
    itinerary: number;
    itineraryStop: number;
  };
  cities: TaxonomyItem[];
  categories: TaxonomyItem[];
  places: PlaceRecord[];
  profiles: ProfileRecord[];
  favoriteLists: FavoriteListRecord[];
  itineraries: ItineraryRecord[];
  itineraryStops: ItineraryStopRecord[];
};

export type PlaceDto = Omit<PlaceRecord, 'photoKey' | 'status' | 'createdAt' | 'updatedAt' | 'slug'> & {
  photo: string;
};

const dataDirectory = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(process.cwd(), 'data');
const packagedDataDirectory = path.join(process.cwd(), 'data');
const storePath = path.join(dataDirectory, 'store.json');
const seedPath = path.join(packagedDataDirectory, 'seed.json');
const packagedUploadDirectory = path.join(packagedDataDirectory, 'uploads');
const seedAssetDirectory = path.join(packagedDataDirectory, 'seed-assets');
const uploadDirectory = path.join(dataDirectory, 'uploads');

let mutationQueue: Promise<void> = Promise.resolve();

async function loadStore(): Promise<StoreData> {
  await mkdir(dataDirectory, { recursive: true });
  await mkdir(uploadDirectory, { recursive: true });
  for (const source of [seedAssetDirectory, packagedUploadDirectory]) {
    try {
      await cp(source, uploadDirectory, {
        recursive: true,
        force: false,
        errorOnExist: false,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  try {
    return JSON.parse(await readFile(storePath, 'utf8')) as StoreData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const seed = JSON.parse(await readFile(seedPath, 'utf8')) as StoreData;
    await writeFile(storePath, JSON.stringify(seed, null, 2), 'utf8');
    return seed;
  }
}

async function persistStore(store: StoreData) {
  const temporaryPath = `${storePath}.${process.pid}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(store, null, 2), 'utf8');
  await rename(temporaryPath, storePath);
}

export async function readStore() {
  await mutationQueue;
  return structuredClone(await loadStore());
}

export async function updateStore<T>(mutate: (store: StoreData) => T | Promise<T>): Promise<T> {
  const previous = mutationQueue;
  let release!: () => void;
  mutationQueue = new Promise<void>((resolve) => {
    release = resolve;
  });
  await previous;
  try {
    const store = await loadStore();
    const result = await mutate(store);
    await persistStore(store);
    return result;
  } finally {
    release();
  }
}

export function nextId(store: StoreData, kind: keyof StoreData['counters']) {
  store.counters[kind] += 1;
  return store.counters[kind];
}

export function requireSafeObjectKey(key: string) {
  const normalized = key.replaceAll('\\', '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..') || normalized.includes('\0')) {
    throw new Error('Invalid object key.');
  }
  return normalized;
}

export async function savePhoto(key: string, contents: ArrayBuffer | Uint8Array) {
  const relativeKey = requireSafeObjectKey(key);
  const destination = path.join(uploadDirectory, relativeKey);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, new Uint8Array(contents));
  return relativeKey;
}

export async function readPhoto(key: string) {
  return readFile(path.join(uploadDirectory, requireSafeObjectKey(key)));
}

export async function deletePhoto(key: string | null) {
  if (!key) return;
  try {
    await unlink(path.join(uploadDirectory, requireSafeObjectKey(key)));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT' && code !== 'EBUSY') throw error;
  }
}

export function photoUrl(key: string | null) {
  return key
    ? `/api/photos/${key.split('/').map(encodeURIComponent).join('/')}`
    : 'https://images.unsplash.com/photo-1565552645890-46e7e38a0c30?auto=format&fit=crop&w=1000&q=80';
}

export function toPlaceDto(place: PlaceRecord): PlaceDto {
  const { photoKey, status: _status, createdAt: _createdAt, updatedAt: _updatedAt, slug: _slug, ...visible } = place;
  return { ...visible, photo: photoUrl(photoKey) };
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || `item-${crypto.randomUUID().slice(0, 8)}`;
}

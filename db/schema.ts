import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const places = sqliteTable('places', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull(),
  city: text('city', { enum: ['makkah', 'madinah'] }).notNull(),
  latitude: text('latitude').notNull(),
  longitude: text('longitude').notNull(),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  descriptionAr: text('description_ar').notNull(),
  descriptionEn: text('description_en').notNull(),
  category: text('category').notNull(),
  era: text('era'),
  sourceUrl: text('source_url'),
  sourceLabelAr: text('source_label_ar'),
  sourceLabelEn: text('source_label_en'),
  status: text('status', { enum: ['draft', 'review', 'published'] }).notNull().default('draft'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('idx_places_slug').on(table.slug),
  index('idx_places_city_status').on(table.city, table.status),
]);

export const placePhotos = sqliteTable('place_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  placeId: integer('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  objectKey: text('object_key').notNull(),
  altAr: text('alt_ar').notNull(),
  altEn: text('alt_en').notNull(),
  credit: text('credit'),
  position: integer('position').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [index('idx_place_photos_place_position').on(table.placeId, table.position)]);

export const profiles = sqliteTable('profiles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authSubject: text('auth_subject').notNull(),
  username: text('username').notNull(),
  displayName: text('display_name'),
  role: text('role', { enum: ['member', 'editor', 'admin'] }).notNull().default('member'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [uniqueIndex('idx_profiles_auth_subject').on(table.authSubject), uniqueIndex('idx_profiles_username').on(table.username)]);

export const favorites = sqliteTable('favorites', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  placeId: integer('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [uniqueIndex('idx_favorites_profile_place').on(table.profileId, table.placeId)]);

export const favoriteLists = sqliteTable('favorite_lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  shareToken: text('share_token'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('idx_favorite_lists_share_token').on(table.shareToken),
  index('idx_favorite_lists_profile').on(table.profileId),
]);

export const favoriteListPlaces = sqliteTable('favorite_list_places', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  favoriteListId: integer('favorite_list_id').notNull().references(() => favoriteLists.id, { onDelete: 'cascade' }),
  placeId: integer('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
}, (table) => [
  uniqueIndex('idx_favorite_list_places_list_place').on(table.favoriteListId, table.placeId),
  index('idx_favorite_list_places_list').on(table.favoriteListId),
]);

export const itineraries = sqliteTable('itineraries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  profileId: integer('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  startsOn: text('starts_on'),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  shareToken: text('share_token').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
}, (table) => [uniqueIndex('idx_itineraries_share_token').on(table.shareToken), index('idx_itineraries_profile').on(table.profileId)]);

export const itineraryStops = sqliteTable('itinerary_stops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itineraryId: integer('itinerary_id').notNull().references(() => itineraries.id, { onDelete: 'cascade' }),
  placeId: integer('place_id').notNull().references(() => places.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull().default(1),
  position: integer('position').notNull().default(0),
  note: text('note'),
}, (table) => [index('idx_itinerary_stops_itinerary_day_position').on(table.itineraryId, table.dayNumber, table.position)]);

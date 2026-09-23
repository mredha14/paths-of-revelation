# Paths of Revelation

This app uses Cloudflare for its runtime services and Supabase only for authentication:

- **Cloudflare D1 (`DB`)** stores places, profiles, favourites, lists, and taxonomy.
- **Cloudflare R2 (`FILES`)** stores uploaded place photos.
- **Supabase Auth** signs users in; the app verifies their access token on the server.

## Cloudflare

The project is connected to the D1 database **`paths-of-revelation`** (ID `87bd5b18-3717-435c-a507-461322e8cea2`) in `wrangler.jsonc`.

Before the first deployment, create an R2 bucket named `paths-of-revelation-files` in the same Cloudflare account. Then apply the committed D1 migrations:

```powershell
npm run db:migrate
```

`wrangler.jsonc` binds the database as `DB` and the bucket as `FILES`; those names match the application code.

## Supabase

1. Create or select a Supabase project.
2. In **Authentication → URL Configuration**, add your Cloudflare production URL and local development URL to the allowed redirect URLs.
3. In **Authentication → Providers**, enable the sign-in method you want the site to show (email/password is the simplest starting point).
4. Add the four variables from `.dev.vars.example` as Cloudflare Worker secrets. `SUPABASE_SERVICE_ROLE_KEY` must remain a secret.

For local work, copy `.dev.vars.example` to `.dev.vars` and replace the placeholders. The `.dev.vars` file is ignored by Git.

## Commands

```powershell
npm run dev
npm run build
npm run lint
npm run db:migrate
```

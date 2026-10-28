# Paths of Revelation

This app runs as a standard Node.js application on Hostinger. Site content,
accounts, favorite lists, uploaded photos, and categorization data are stored
under `data/`; Supabase is used for authentication.

## Supabase

1. In **Authentication → URL Configuration**, add `https://por.zataat.com`.
2. In **Authentication → Providers**, keep the existing email/password sign-in enabled.
3. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `ADMIN_EMAIL_ALLOWLIST` to the Hostinger Node.js environment.
4. `SUPABASE_SERVICE_ROLE_KEY` is optional. Never expose it to the browser.

For local work, copy `.env.example` to `.env.local` and replace the placeholders.

## Commands

```powershell
npm run dev
npm run build
npm run lint
node scripts/package-hostinger.mjs
```

`data/seed.json` contains the imported site content. Runtime edits are written
to `store.json` inside `DATA_DIR`, which is intentionally excluded from Git.
On Hostinger, set `DATA_DIR` to a persistent directory such as
`/home/USER/domains/por.zataat.com/storage`. Back up `store.json` and
`uploads/` from that directory after content changes.

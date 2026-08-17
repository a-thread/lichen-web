# Lichen (Web)

Offline-first notes app — Angular frontend, existing Supabase backend. A jumping-off point,
ported from the Lichen Android app's data model.

## What's here
- Standalone Angular components (no NgModules), signals for state
- `core/notes.service.ts` — local-first read/write via IndexedDB, background sync to Supabase
- `core/supabase.service.ts` — same `notes` table schema as the Android app, so both clients
  can point at one Supabase project
- `core/auth.service.ts` + `core/auth.guard.ts` — full Supabase email/password auth: sign in,
  sign up (with email confirmation), forgot/reset password (via Supabase's redirect link), sign
  out. Note routes are guarded and redirect to `/login` when signed out.
- PWA service worker for offline app-shell caching
- GitHub Pages deploy workflow (same pattern as the portfolio site)

## Setup
1. `npm install`
2. Copy your Supabase URL/anon key into `src/environments/environment.ts`
3. In the Supabase dashboard, set your Site URL / Redirect URLs (Auth settings) to include
   wherever this app is hosted (e.g. `http://localhost:4200` for local dev) — required for the
   sign-up confirmation and password-reset email links to redirect back correctly.
4. `npm run dev`

## Deploying
Push to `main`. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as GitHub Actions secrets first —
the workflow injects them at build time so real keys never get committed.

## Deliberately out of scope for this pass
- Rich text / block-based editor (Lichen's `EditorBlockParser` — plain textarea for now)
- Checklists, import/export, theming
- Conflict resolution beyond last-write-wins

The goal was a working offline-first loop (create/edit/delete, sync, auth, install-to-home-screen)
in your target stack, not full feature parity with the Android app.

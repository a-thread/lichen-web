# Lichen (Web)

Offline-first notes app — Angular frontend, existing Supabase backend. A jumping-off point,
ported from the Lichen Android app's data model.

## What's here
- **Angular 22**, zoneless by default (`provideZonelessChangeDetection()`), OnPush is the implicit
  default change-detection strategy — no zone.js in the bundle. Built with the current
  `@angular/build:application` builder (the old `@angular-devkit/build-angular` builders are
  deprecated as of v22).
- Standalone components throughout, using signal `input()`/`output()` and `viewChild()` instead
  of the `@Input`/`@Output`/`@ViewChild` decorators
- `core/notes.service.ts` — local-first read/write via IndexedDB, background sync to Supabase
- `core/supabase.service.ts` — same `notes` table schema as the Android app, so both clients
  can point at one Supabase project
- `core/auth.service.ts` + `core/auth.guard.ts` — full Supabase email/password auth: sign in,
  sign up (with email confirmation), forgot/reset password (via Supabase's redirect link), sign
  out. Note routes are guarded and redirect to `/login` when signed out.
- `core/editor/` — the block-based markdown editor ported from Lichen's Kotlin implementation:
  `editor-block-parser.ts` (headings/checklist/bullets/numbered list/divider/text),
  `editor-input-transform.ts` (auto-continue lists on Enter, collapse empty markers on
  Backspace), `toolbar-actions.ts` (bold/italic/code, block toggles, heading style, active-state
  detection), `inline-markdown.ts` (bold/italic/code span rendering). Write mode is the raw
  markdown-like textarea + toolbar; Preview mode renders it with clickable checklist items.
- PWA service worker for offline app-shell caching
- GitHub Pages deploy workflow (same pattern as the portfolio site)

**Note:** the Android app's block parser never actually produced numbered-list blocks (numbered
lines fell through to plain text) even though the toolbar/model supported them. This port fixes
that gap so numbered lists render correctly — everything else is a faithful port.

**Zoneless correctness:** all component state that changes outside a direct template event
(async calls, `window` event listeners, etc.) is stored in signals rather than plain fields, so
change detection fires correctly without zone.js patching. If you add new state, keep it a
signal rather than a plain class field bound via `[(ngModel)]` — binding `[(ngModel)]` directly
to a signal doesn't work; use `[ngModel]="mySignal()"` + `(ngModelChange)="mySignal.set($event)"`.

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
- Import/export, theming (dark mode)
- Conflict resolution beyond last-write-wins
- Nested nesting UI polish for deeply indented lists (parsing supports it; toolbar doesn't add a dedicated indent/outdent button yet, matching the Android app)

The goal was a working offline-first loop (create/edit/delete, sync, auth, install-to-home-screen)
in your target stack, not full feature parity with the Android app.

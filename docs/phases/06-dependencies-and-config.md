# Phase 6 — Dependencies and config cleanup

## Goal

`package.json`, Vite config, and env files match an admin SPA. Recruiter-only libraries and env keys are gone.

## Why

The copy still depends on pipeline/poster/marketing tooling that admin does not need. That slows installs, confuses future work, and leaves recruiter config (`cashfreeMode` for checkout, dnd-kit optimizeDeps, lovable-tagger) in an admin repo.

## In scope

After grep confirms zero imports, remove packages such as:

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (kanban)
- `@supabase/supabase-js` if unused
- `lovable-tagger` and its Vite plugin
- Poster/PDF stack if unused: `jspdf`, `html2canvas`, `dom-to-image-more` (keep `xlsx` / `file-saver` only if admin bulk export still uses them)
- Recruiter-only UI extras if unused (`react-phone-number-input`, `react-quill` — **check first**: admin email TemplateEditor uses rich text; `RichTextEditor` may need `react-quill` or `quill`)

Config:

- `vite.config.ts`: port already 8082 (phase 1); drop dnd-kit `optimizeDeps`; drop `componentTagger`.
- `src/config/env.ts`: keep `apiBaseUrl` + `clerkPublishableKey`. Drop `cashfreeMode` **only if** nothing reads it. Admin Users/Plans still send Cashfree IDs to the **backend**; they do not need a frontend Cashfree SDK mode.
- `.env.example`: admin-relevant keys only.
- `src/components/debug/EnvDebug.tsx`: stop showing recruiter/cashfree fields that no longer exist.
- `src/types/auth.ts`: drop `UserRole.RECRUITER` / `USER` and recruiter `Permission`s if no admin code needs them. Keep admin/superadmin.
- Remove unused legacy files: `AuthContext.tsx`, `AdminRoute.tsx`, `ProtectedRoute.tsx` if grepped unused.
- `package.json` scripts stay `dev` / `build` / `lint` / `preview`.

## Out of scope

- Production DNS, Clerk origins, backend CORS (phase 7).
- Rewriting admin email or plans features.

## Depends on

Phases 4–5 (deleted code is what makes packages unused).

## Success criteria

- `npm run build` and `npm run lint` pass.
- `package.json` has no `@dnd-kit` unless a remaining admin feature uses it (none currently outside pipeline).
- `.env.example` does not describe recruiter checkout.
- `UserRole` in this app is admin-centric.

## Execution plan

To be written before implementation.

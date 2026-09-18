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

Do these steps in order. Do not change `recruiter-frontend`, the backend, Clerk Dashboard, DNS/CORS (phase 7), or admin email/plans product features. Keep `xlsx` (bulk upload) and `react-quill` / `quill` (RichTextEditor). Do not edit the user’s real `.env` secrets; only update `.env.example` and code that reads env.

**Locked defaults:** uninstall confirmed-unused packages; delete unused shadcn/shared wrappers that only exist to pull deps; drop `cashfreeMode` from frontend config; slim `UserRole` to `ADMIN` / `SUPERADMIN`; remove GTM/Clarity analytics wiring.

### Current state (after phase 5)

- `package.json` still lists recruiter leftovers: `@dnd-kit/*`, `@supabase/supabase-js`, `jspdf` / `html2canvas` / `dom-to-image-more` / `file-saver`, `react-phone-number-input`, `lottie-react`, `mixpanel-browser`, `react-helmet-async`, `react-circular-progressbar`, `uuid`, plus `lovable-tagger` (dev).
- `vite.config.ts`: still imports `componentTagger` and `optimizeDeps` for dnd-kit; port already `8082`.
- `env.ts` + `.env.example`: still export / document `cashfreeMode` / `VITE_*_CASHFREE_MODE`. Only `EnvDebug.tsx` reads `cashfreeMode`.
- `auth.ts` still has `USER` / `RECRUITER` and recruiter `Permission`s. Runtime guards only need `ADMIN` / `SUPERADMIN`.
- Legacy `AuthContext` / `AdminRoute` / `ProtectedRoute` / `PermissionGate` are already deleted (phase 4).
- Helmet already removed from `main.tsx`; `react-helmet-async` dep remains.
- `App.tsx` still mounts `useAnalytics` / `PageViewTracker` against `AnalyticsService.js` even though phase 5 stripped GTM/Clarity from `index.html`.

### 1. Uninstall dead packages

From `fmj-admin`, after one more confirm-grep, `npm uninstall`:

**dependencies:** `@dnd-kit/core` `@dnd-kit/sortable` `@dnd-kit/utilities` `@supabase/supabase-js` `jspdf` `html2canvas` `dom-to-image-more` `file-saver` `react-phone-number-input` `lottie-react` `mixpanel-browser` `react-helmet-async` `react-circular-progressbar` `uuid` `embla-carousel-react` `input-otp` `vaul` `framer-motion` `next-themes`

**devDependencies:** `lovable-tagger`

**Keep:** `xlsx`, `react-quill`, `quill`, and all remaining admin UI / Clerk / query stack.

### 2. Vite config

In `vite.config.ts`:

- Remove `lovable-tagger` import and `componentTagger()` from `plugins` (leave `@vitejs/plugin-react-swc` only).
- Remove the entire `optimizeDeps` block for dnd-kit.
- Keep `server.port: 8082`, `allowedHosts`, alias `@`.

### 3. Delete dead source pulled in by those deps

Delete (no remaining consumers):

- `src/components/ui/carousel.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/input-otp.tsx`
- `src/components/shared/EmptyState.tsx`, `AnimatedCounter.tsx`, `AnimatedCard.tsx`
- `src/services/AnalyticsService.js`, `src/hooks/useAnalytics.ts`

In `App.tsx`: remove `useAnalytics`, `PageViewTracker`, and its mount under the router.

In `sonner.tsx`: drop `useTheme` from `next-themes`; pass a fixed `theme="system"` so the toaster still works.

In `index.css`: remove the orphan `.PhoneInput*` rules.

### 4. Env / Cashfree frontend config

- `env.ts`: remove `cashfreeMode` from `Config`, `getConfig()`, and named exports. Keep `apiBaseUrl` + `clerkPublishableKey` (+ `env`).
- `.env.example`: remove all `VITE_*_CASHFREE_MODE` lines; keep `VITE_ENV`, API base URLs, Clerk keys, and the note about reusing the recruiter Clerk key.
- `EnvDebug.tsx`: stop logging / referencing `cashfreeMode`.

Do not strip Cashfree **API** fields from Users/Plans admin pages.

### 5. Slim auth types

In `auth.ts`:

- `UserRole`: keep only `ADMIN` and `SUPERADMIN`.
- `Permission`: drop recruiter/user job permissions; keep admin ones (`MANAGE_USERS`, `MANAGE_RECRUITERS`, `MANAGE_PLANS`, `VIEW_ANALYTICS`, `MANAGE_SYSTEM`). Drop unused profile perms if nothing references them.
- `ROLE_PERMISSIONS`: only admin + superadmin entries.

In `authHelpers.ts`:

- Remove unused `isRecruiterRole` and `getRoleName` if unused.
- Keep `isAdminRole`, `extractRoleFromClerk`, `getUserPermissions`.

Effect: Clerk metadata `role: "recruiter" | "user"` will no longer parse to a `UserRole` enum value (`undefined`), so `isAdminRole` stays false and AccessDenied still applies.

### 6. Verify

Grep `fmj-admin` excluding `docs/` and `node_modules` for: `@dnd-kit`, `lovable-tagger`, `cashfreeMode`, `CASHFREE_MODE`, `react-helmet`, `AnalyticsService`, `useAnalytics`, `UserRole.RECRUITER`, `UserRole.USER`, `jspdf`, `supabase`, `PhoneInput`.

Then: `npm run build` and `npm run lint`. Spot-check admin sign-in still loads and `/admin` still works for a signed-in admin.

### Out of this phase

No Clerk allowed origins / DNS / CORS / Vercel cutover (phase 7). No rewrite of admin sidebar, email TemplateEditor, or Plans Cashfree ID fields. No commit unless asked.

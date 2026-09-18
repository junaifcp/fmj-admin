# Phase 3 — Routing

## Goal

This app’s router only knows **public sign-in** and **admin panel**. Recruiter, employer, and public-apply routes are unmounted.

## Why

Even with admin-only auth, `src/routes/index.tsx` still registers:

- `recruiterLayoutRoutes` at `/recruiter/*`
- Public `/sign-up`, `/apply/:uniqueId`, legal/pricing/contact, unsubscribe
- `PATHS.RECRUITER.*` in `src/routes/paths.ts`

Leaving those mounted keeps recruiter chunks in the bundle and makes accidental deep-links possible.

## In scope

- Remove recruiter route registration from `src/routes/index.tsx` (`RecruiterGuard`, `getRecruiterMe`, `recruiter.routes.ts`).
- Delete or stop exporting `src/routes/recruiter.routes.ts`.
- Slim `src/routes/public.routes.ts` to sign-in + 404 (legal pages removed in phase 5; they can be unmounted here).
- Remove `/apply/:uniqueId` (public employer apply form).
- Update `src/routes/paths.ts`: drop `RECRUITER`, drop unused public paths, keep `ADMIN` (and `SIGN_IN` / `HOME`).
- Rewrite `src/routes/README.md` so it no longer documents recruiter routes.
- **Keep `/admin` as the admin layout prefix** for this phase so AdminLayout nav hrefs keep working.

## Out of scope

- Deleting `src/pages/recruiter/**` and components (phase 4). After this phase they should be unreferenced.
- Flattening `/admin` → `/dashboard` (optional, phase 7).
- Auth policy (already done in phase 2).

## Route map after this phase

| Path | Page | Access |
| --- | --- | --- |
| `/` | Admin sign-in landing | Public |
| `/sign-in` | Sign-in (optional duplicate of `/`) | Public |
| `/admin` and `/admin/*` | Existing admin panel | `AdminGuard` + `getAdminMe` |
| `*` | Not found | Public |
| `/recruiter/*` | gone | — |
| `/sign-up`, `/apply/:uniqueId` | gone | — |

## Depends on

Phase 2 (admin-only redirects/guards already defined).

## Success criteria

- Visiting `/recruiter` or `/recruiter/dashboard` is a 404, not a recruiter layout.
- Visiting `/apply/anything` is a 404.
- All current admin nav items still open (`/admin/users`, `/admin/recruiters`, management, email, …).
- `npm run build` may still fail if dead imports remain; that is acceptable **only if** phase 4 is scheduled immediately. Prefer a green build if unmounting is enough.

## Execution plan

Do these steps in order. Do not delete `src/pages/recruiter/**` or recruiter components (phase 4). Do not flatten `/admin` (phase 7). Do not change auth policy.

Phase 2 already wraps leftover `/recruiter/*` in `AdminGuard`. This phase **unmounts** those routes so they 404 instead of loading recruiter chunks.

Target router: `/` and `/sign-in` (public) → `AdminGuard` + `getAdminMe` on `/admin/*` → `*` NotFound.

### Already true after phase 2

- `src/routes/index.tsx` no longer uses `RecruiterGuard` / `getRecruiterMe`; leftover recruiter routes still import `src/routes/recruiter.routes.ts`.
- `/sign-up` currently redirects home. After this phase it should 404 (route map: gone).
- `PATHS` is only imported by `SignInLanding`, `SignInForm`, and `RoleGuard` (`HOME`, `SIGN_IN`, `ADMIN.DASHBOARD`). Safe to drop `RECRUITER` and unused public keys.

### 1. Unmount recruiter routes

In `src/routes/index.tsx`:

- Remove imports of `recruiterStandaloneRoutes` and `recruiterLayoutRoutes`.
- Remove the recruiter `renderRoute` blocks (the leftover AdminGuard-wrapped recruiter routes).
- Keep `publicRoutes` + `adminLayoutRoutes` behind `AdminGuard` + `getAdminMe`.
- Keep the `renderRoute` helper as-is.

Delete `src/routes/recruiter.routes.ts`. Do not delete recruiter pages/components.

### 2. Slim public routes

In `src/routes/public.routes.ts` keep only:

- `/` → `SignInLanding`
- `/sign-in` → `SignInForm`
- `*` → `NotFound`

Remove: `/sign-up` redirect, `/apply/:uniqueId`, `/contact`, legal/pricing pages, `/unsubscribe/:token`. Drop `Navigate` / `createElement` / `PublicApplyForm` imports.

Unmounting legal routes would 404 the footer on `src/pages/SignInLanding.tsx` (Terms, Privacy, Contact). Remove that footer in the same pass so public links match the router. Do not rewrite the carousel (phase 5).

Point `src/pages/NotFound.tsx` “Go to Dashboard” at `/` (or `/sign-in`). It currently links to `/dashboard`, which does not exist.

### 3. Slim path constants

In `src/routes/paths.ts`:

- Keep `HOME`, `SIGN_IN`, and `ADMIN` (leave `/admin` prefix; do not add missing admin nav paths unless a live import needs them).
- Remove `SIGN_UP`, `CONTACT`, `TERMS`, `REFUND_POLICY`, `PRIVACY_POLICY`, `PRICING_POLICY`, `RECRUITER`, and `buildPath.recruiterJobDetails`.

### 4. Rewrite routes README

Rewrite `src/routes/README.md` as admin-only: public sign-in + `admin.routes.ts`. Remove recruiter add-a-route examples and `recruiter.routes.ts` from the tree.

### 5. Verify

1. Grep `src/routes` for `recruiter.routes`, `/apply`, `PublicApply`, `PATHS.RECRUITER`.
2. Browser (unsigned): `/recruiter` and `/recruiter/dashboard` and `/apply/anything` are **404**, not Access Denied / recruiter layout.
3. `/` and `/sign-in` still show sign-in. `/sign-up` is 404.
4. Signed-in admin: sidebar items still work (`/admin`, `/admin/users`, `/admin/recruiters`, management, email). Do not change AdminLayout hrefs.
5. `npm run build` should stay green: recruiter files remain on disk but are no longer in the route graph. If tsc fails on unused files, defer deletes to phase 4.

### Out of this phase

No deleting `src/pages/recruiter`, `src/components/recruiter`, `SignUpForm.tsx`, or legal page files. No `/admin` URL flatten. No Clerk/CORS.

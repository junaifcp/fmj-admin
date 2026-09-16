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

To be written before implementation.

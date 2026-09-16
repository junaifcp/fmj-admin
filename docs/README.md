# fmj-admin — extraction plan

`fmj-admin` is a copy of `recruiter-frontend`. The goal is to turn it into a **dedicated admin app** at **admin.fitmyskill.com**.

Recruiters and employers keep using `recruiter-frontend` (recruiter.fitmyskill.com). This app must authenticate **admins and superadmins only**, then serve the existing admin panel.

Detailed step-by-step execution plans will be written **per phase** before that phase is implemented. These files are the phase briefs.

## Target

| Item | Target |
| --- | --- |
| Product | FitMySkill Admin |
| Host | `admin.fitmyskill.com` |
| Who can sign in | `admin`, `superadmin` |
| Who is rejected | recruiter, employer, candidate/`user`, unsigned |
| What stays | Existing admin panel (users, recruiters, taxonomy, email, etc.) |
| What goes | Recruiter product, employer job posting, public apply, sign-up, marketing landing |

Backend stays `resume-builder-backend`. This split is frontend-only. Admin API routes already exist and stay role-gated on the server.

## How to read these docs

1. Read this file and [keep-vs-remove.md](./keep-vs-remove.md).
2. Implement phases **in order**. Do not skip.
3. Before coding a phase, write its execution plan in that phase file (section at the bottom).
4. A phase is done only when its success criteria pass.

## Phases

| Phase | File | Outcome |
| --- | --- | --- |
| 1 | [phases/01-baseline-and-identity.md](./phases/01-baseline-and-identity.md) | App identity is admin, not recruiter. Safe to run beside recruiter-frontend. |
| 2 | [phases/02-admin-only-authentication.md](./phases/02-admin-only-authentication.md) | Only admin/superadmin can enter. Recruiters and other roles are blocked. |
| 3 | [phases/03-routing.md](./phases/03-routing.md) | Recruiter/employer routes are unmounted. Only sign-in + admin routes remain. |
| 4 | [phases/04-remove-recruiter-employer-code.md](./phases/04-remove-recruiter-employer-code.md) | Recruiter/employer source is deleted. Admin features still compile and run. |
| 5 | [phases/05-public-surface-and-branding.md](./phases/05-public-surface-and-branding.md) | Public surface is a private admin sign-in, not an employer marketing site. |
| 6 | [phases/06-dependencies-and-config.md](./phases/06-dependencies-and-config.md) | Unused packages, env keys, and recruiter config are gone. |
| 7 | [phases/07-hosting-and-domain.md](./phases/07-hosting-and-domain.md) | App is reachable at admin.fitmyskill.com with Clerk + CORS wired. |

## Working rules

- Do **not** change `recruiter-frontend` as part of this extraction unless a later phase explicitly needs a redirect/cutover.
- Do **not** delete admin pages that *manage* recruiters (`/admin/recruiters`, recruiter dashboard). Those are admin tools, not the recruiter product.
- Do **not** trust Clerk metadata alone for admin access. Keep `getAdminMe` backend verification.
- Do **not** add public sign-up. Admins are provisioned, not self-registered.
- After deleting files, grep for leftover imports before calling the phase done.
- Keep `/admin/*` paths in early phases so existing admin links still work. Flattening routes is optional and belongs in phase 7 (or later).

## Open decisions (resolve during the named phase)

| Decision | Default recommendation | Resolve in |
| --- | --- | --- |
| Clerk app | Reuse the **recruiter Clerk** instance (admins already live there). Add `admin.fitmyskill.com` as an allowed origin. | Phase 2 / 7 |
| URL prefix | Keep `/admin/*` until the app is stable. Optional flatten to `/` later. | Phase 3 / 7 |
| Dev port | `8082` so it can run next to recruiter on `8081`. | Phase 1 |
| Legal/marketing pages | Remove employer terms/pricing/contact from this app. Sign-in + 404 only. | Phase 5 |
| Sign-up | Disabled. Invite/provision admins in Clerk. | Phase 2 |
| Search indexing | `noindex` on admin.fitmyskill.com. | Phase 5 / 7 |

## Current stack (copied as-is)

Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Clerk + React Query.

- Entry: `src/main.tsx` → `src/App.tsx` → `src/routes/index.tsx`
- Admin routes: `src/routes/admin.routes.ts` behind `AdminGuard` + `getAdminMe`
- Recruiter routes: `src/routes/recruiter.routes.ts` behind `RecruiterGuard` + `getRecruiterMe` (remove)
- Public routes still include sign-up, legal pages, and public job apply (remove)

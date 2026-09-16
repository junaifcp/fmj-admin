# Phase 4 — Remove recruiter and employer code

## Goal

Delete source that exists only for recruiters, employers, pipelines, posters, onboarding, and public apply. The remaining tree is admin panel + shared UI + admin auth.

## Why

After phase 3 those files are dead weight. Leaving them in the repo invites people to “fix” recruiter features in the admin app.

Use [keep-vs-remove.md](../keep-vs-remove.md) as the checklist. Recheck with grep; do not delete a file that an admin page still imports.

## In scope

Delete (after confirming no remaining imports):

- `src/pages/recruiter/**`
- `src/components/recruiter/**`
- `src/components/onboarding/**`
- `src/components/job-insights/**`
- `src/pages/public/**`, `src/components/public/**`
- `src/api/recruiter.ts`, `src/api/public.ts`
- Recruiter types: `recruiter.ts`, `jobs.ts`, `pipeline.ts`, `poster.ts`, `onboarding.ts`, `jobInsights.ts`
- Recruiter hooks listed in keep-vs-remove
- `RecruiterGuard` / `useRecruiterRoleAuth` / `RecruiterRoute` / `useRecruiterAuth`
- `src/examples/auth-usage-examples.tsx`
- Recruiter-only utils (pipeline, job PDF, poster export) if unused
- Places/onboarding APIs and hooks if unused by admin

Keep:

- Entire `src/pages/admin/**` and `src/components/admin/**` (including recruiter **management**)
- `src/api/admin.ts`, `businessData.ts`, `company.ts`, `candidateMetrics.ts`
- `AdminGuard`, `getAdminMe`, ImprovedAuth
- shadcn `src/components/ui/**` (prune unused in phase 6)

## Out of scope

- npm uninstall (phase 6), even if `@dnd-kit` is now unused.
- Rewriting admin pages.
- Changing backend.

## Deletion safety

1. Unmount first (phase 3) — already done.
2. Delete directories in the keep-vs-remove “Remove” tables.
3. Grep the repo (exclude `docs/`):

   - `recruiter` (expect hits only in admin copy and admin recruiter-management pages)
   - `getRecruiterMe`
   - `/recruiter`
   - `employer`
   - `PublicApply`
   - `SignUpForm`
   - `RecruiterGuard`
   - `useRecruiterAuth`

4. `npm run build` and `npm run lint` must pass.

## Depends on

Phase 3 (nothing in the app should still import recruiter pages).

## Success criteria

- No `src/pages/recruiter` or `src/components/recruiter` directories.
- No public apply or recruiter sign-up components.
- Admin panel pages still typecheck and the production build succeeds.
- Remaining “recruiter” strings are admin management UI, types in `src/types/admin.ts`, or API fields — not a second product.

## Execution plan

To be written before implementation.

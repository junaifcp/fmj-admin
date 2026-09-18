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

Do these steps in order. Do not change `recruiter-frontend`, the backend, `/admin` URL prefix, Clerk, or npm packages. `tsconfig.app.json` includes all of `src/`, so leftover files still typecheck — delete a file only after its remaining importers are gone or edited.

### Keep (admin product — do not delete)

- Entire `src/pages/admin/**` and `src/components/admin/**` except unused `AdminRoute.tsx`.
- `src/api/admin.ts`, `businessData.ts`, `company.ts`, `candidateMetrics.ts`.
- `src/api/suggestions.ts` and `useSuggestions.ts` — BulkUploadModal, UsersPage, SendEmail.
- `src/api/places.ts` (slim, not delete) and `usePlaceAutocomplete.ts` — admin location filters.
- `types/location.ts`, `useJobPolling.ts`, `useBulkUpload.ts`.
- `AdminGuard`, `getAdminMe`, ImprovedAuth, `useAdminAuth.ts` (still used by AdminLayout).
- `src/components/ui/**` including unused `IndustrySelect` / `MultiSelectWithOther` (prune in phase 6) — therefore keep `constants/industries.ts` and `allowanceOptions.ts`.
- `UserRole.RECRUITER` in `types/auth.ts` so sign-in can still recognize and **deny** recruiters.

Admin pages that mention recruiters stay: `RecruitersPage`, `recruiters/RecruitersDashboard`, company verification, email targeting.

### Leave for later phases

- Phase 5: `LandingPage`, `Index`, legal/pricing/contact, `Unsubscribe.tsx`, `unsubscribeApi.ts`, `Navigation.tsx`, PWA, `index.html` GTM/noindex, sign-in copy.
- Phase 6: `@dnd-kit`, jspdf/html2canvas, unused shadcn primitives, Cashfree env flags.

Because legal pages still import Navigation, **patch** `Navigation.tsx` in this phase: drop `useRecruiterAuth` and `/recruiter/dashboard` redirects (logo/home → `/` or `/admin` via `useAdminAuth` / Clerk only). Do not rewrite the legal pages.

### 1. Delete product trees (already unmounted)

Remove directories:

- `src/pages/recruiter/**`
- `src/components/recruiter/**`
- `src/components/onboarding/**`
- `src/components/job-insights/**`
- `src/pages/public/**`
- `src/components/public/**`

Also delete recruiter-only duplicates/one-offs:

- `src/components/common/IndustrySelect.tsx` (recruiter `CompanyForm` only; `components/ui/IndustrySelect.tsx` stays)
- `src/examples/auth-usage-examples.tsx`
- `src/tests/Dashboard.test.tsx`
- `src/scripts/migrate-default-resumes.js`

### 2. Delete recruiter APIs, types, hooks, utils

After the trees are gone, delete:

- `src/api/recruiter.ts`, `src/api/public.ts`
- Types: `recruiter.ts`, `jobs.ts`, `pipeline.ts`, `poster.ts`, `onboarding.ts`, `jobInsights.ts`
- Hooks: `useRecruiterAuth.ts`, `useRecruiterReferral.ts`, `useJobApplications.ts`, `useJobInsights.ts`, `usePipelineStatus.ts`, `useMockPipeline.ts`, `useAi.ts`, `useBusinessSuggestions.ts`, `useBusinessResolve.ts`
- Utils: `pipelineUtils.ts`, `jobDetailsPdf.ts`, `exportImage.ts`
- Mock: `src/services/mock/pipelineMockData.ts`
- Constants: `educationOptions.ts` only (industries/allowance stay for unused UI primitives)

### 3. Small remaining-file edits

`src/api/places.ts` — keep `getPlaceSuggestions` / `resolvePlaceId` / `searchPlaces`. Remove `businessSuggest`, `businessResolve`, `setCompanyLocation`, `setJobLocation`, and the `@/types/onboarding` import so `onboarding.ts` can be deleted.

`src/components/auth/RoleGuard.tsx` — delete the leftover `export const RecruiterGuard = AdminGuard`.

Auth wrappers now unreferenced — delete:

- `SignUpForm.tsx`
- `RecruiterRoute.tsx`
- `ProtectedRoute.tsx`
- `PermissionGate.tsx`
- `AdminRoute.tsx`
- `AuthContext.tsx` (App already uses ImprovedAuth)

`Navigation.tsx` — remove `useRecruiterAuth`; signed-in logo goes to `/admin` if admin else `/`.

### 4. Verify

Grep `fmj-admin` excluding `docs/` and `node_modules`:

- `getRecruiterMe`, `RecruiterGuard`, `useRecruiterAuth`, `useRecruiterRoleAuth`, `SignUpForm`, `PublicApply`, `pages/recruiter`, `components/recruiter`
- `/recruiter` (expect none in `src/` except maybe comments)
- `employer` (expect none in deleted product; admin “Employers” metric copy on Dashboard may remain)
- `recruiter` — remaining hits must be admin management (`RecruitersPage`, `AdminRecruiter`, API fields, AccessDenied copy, `UserRole.RECRUITER`)

Then:

- `npm run build` and `npm run lint` in `fmj-admin`
- Browser: unsigned `/recruiter` and `/apply/x` still 404; signed-in admin `/admin` dashboard, `/admin/recruiters`, `/admin/users` still load (no 403)

### Out of this phase

No `npm uninstall`. No AdminLayout rewrite off `useAdminAuth`. No flattening `/admin`. No backend/Clerk/CORS.

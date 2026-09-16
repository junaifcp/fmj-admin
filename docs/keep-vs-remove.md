# Keep vs remove

Inventory of the copied `recruiter-frontend` tree. Use this during phases 3–6. **Verify imports before deleting** — a file listed under Remove may still be pulled in until recruiter routes are unmounted.

## Rule of thumb

| Keep | Remove |
| --- | --- |
| Code the admin panel uses to operate FitMySkill | Code a recruiter/employer uses to hire, post jobs, apply, or pay |
| Admin pages that *manage* recruiters, companies, users | Recruiter *product* pages (`/recruiter/*`) |
| Admin auth (`admin` / `superadmin` + `getAdminMe`) | Recruiter auth, sign-up, referral, public apply |

## Keep

### App shell

- `src/main.tsx`, `src/App.tsx` (slim later)
- `src/config/env.ts` (drop Cashfree later if unused after cleanup)
- `src/api/apiClient.ts`, `src/utils/auth.ts`, `src/utils/authHelpers.ts`
- `src/context/ImprovedAuthContext.tsx`
- `src/hooks/useRoleAuth.ts` (admin-only after phase 2)
- `src/hooks/useAdminAuth.ts` until AdminLayout is switched to `useRoleAuth` / `useImprovedAuth`
- `src/components/auth/RoleGuard.tsx` (`AdminGuard` only)
- `src/components/auth/SignInForm.tsx` (rewrite for admin-only)
- `src/pages/SignInLanding.tsx` (rewrite for admin-only)
- `src/pages/NotFound.tsx`
- `src/lib/utils.ts`, `src/hooks/use-toast.ts`, `src/hooks/use-mobile.tsx`

### Admin product

- `src/pages/admin/**`
- `src/components/admin/**` (except deprecated `AdminRoute.tsx` after migration)
- `src/routes/admin.routes.ts`
- `src/api/admin.ts`
- `src/api/businessData.ts` (admin scraping)
- `src/api/company.ts` (admin company verification)
- `src/api/candidateMetrics.ts` (admin candidate dashboard)
- `src/types/admin.ts`
- `src/types/businessData.ts`
- `src/types/candidateMetrics.ts`
- `src/types/auth.ts` (strip recruiter/user roles after auth is admin-only)
- `src/hooks/useJobPolling.ts` (used by admin Business Data)
- `src/hooks/useBulkUpload.ts` (admin bulk upload)
- `src/utils/emailTemplateUtils.ts`, `src/utils/csv.ts`, `src/utils/dateFilters.ts`, `src/utils/format.ts`
- `src/services/unsubscribeApi.ts` if still used by admin unsubscribe
- `src/components/shared/**`

### UI kit

- `src/components/ui/**` — prune unused primitives in phase 6, not during feature deletion.

Admin pages that **stay** even though they mention recruiters:

- `src/pages/admin/RecruitersPage.tsx`
- `src/pages/admin/recruiters/RecruitersDashboard.tsx`
- Admin management of companies, job titles, skills (platform taxonomy, not the employer job board)

Cashfree **admin** usage also stays: UsersPage order lookup and PlansPage `cashfreePlanId` are admin billing tools, not recruiter checkout.

## Remove

### Recruiter product

| Area | Paths |
| --- | --- |
| Recruiter pages | `src/pages/recruiter/**` |
| Recruiter layout / jobs / companies / applications | `src/components/recruiter/**` |
| Pipelines | `src/components/recruiter/pipeline/**`, `src/pages/recruiter/pipelines/**` |
| Posters | `src/components/recruiter/poster/**` |
| Matching | `src/components/recruiter/matching/**` |
| Application detail | `src/components/recruiter/application/**` |
| Referral / subscription | `src/components/recruiter/subscription/**` |
| Recruiter routes | `src/routes/recruiter.routes.ts` |
| Recruiter API / types | `src/api/recruiter.ts`, `src/types/recruiter.ts`, `src/types/jobs.ts`, `src/types/pipeline.ts`, `src/types/poster.ts` |
| Recruiter auth | `src/hooks/useRecruiterAuth.ts`, `src/hooks/useRecruiterReferral.ts`, `src/components/auth/RecruiterRoute.tsx` |
| Recruiter mocks | `src/services/mock/pipelineMockData.ts`, `src/hooks/useMockPipeline.ts` |

### Employer / hiring extras

| Area | Paths |
| --- | --- |
| Company onboarding | `src/components/onboarding/**`, `src/types/onboarding.ts` |
| Job insights | `src/components/job-insights/**`, `src/types/jobInsights.ts`, `src/hooks/useJobInsights.ts` |
| Public apply (no Clerk) | `src/pages/public/**`, `src/components/public/**`, `src/api/public.ts` |
| Job applications hook | `src/hooks/useJobApplications.ts` |
| Pipeline helpers | `src/hooks/usePipelineStatus.ts`, `src/utils/pipelineUtils.ts`, `src/utils/jobDetailsPdf.ts`, `src/utils/exportImage.ts` |
| Places / business search for onboarding | `src/api/places.ts`, `src/hooks/useBusinessSuggestions.ts`, `src/hooks/useBusinessResolve.ts`, `src/hooks/usePlaceAutocomplete.ts` |
| AI job-copy helper | `src/hooks/useAi.ts` |
| Job form constants | `src/constants/industries.ts`, `src/constants/educationOptions.ts`, `src/constants/allowanceOptions.ts` |

`src/api/suggestions.ts` and `src/hooks/useSuggestions.ts` are used by recruiter job forms and some UI inputs. Delete in phase 4/6 **only if** no admin page still imports them.

### Public / marketing (employer-facing)

| Area | Paths |
| --- | --- |
| Sign-up | `src/components/auth/SignUpForm.tsx` |
| Marketing landing | `src/pages/LandingPage.tsx`, `src/pages/Index.tsx` |
| Legal/pricing (recruiter copies) | `src/pages/TermsConditions.tsx`, `src/pages/PrivacyPolicy.tsx`, `src/pages/RefundPolicy.tsx`, `src/pages/PricingPolicy.tsx`, `src/pages/ContactUs.tsx` |
| Public unsubscribe page | `src/pages/Unsubscribe.tsx` — keep only if admin email tooling still needs the public token route; otherwise move with recruiter |
| Navigation leftover | `src/components/Navigation.tsx` |
| Auth examples | `src/examples/auth-usage-examples.tsx` |
| Legacy auth | `src/context/AuthContext.tsx` if unused |
| Deprecated admin route wrapper | `src/components/admin/AdminRoute.tsx` after AdminLayout uses the current guard/hooks |
| PWA | `src/components/pwa/**`, `src/hooks/usePWAInstall.ts`, `public/sw.js` |
| Recruiter tests | `src/tests/Dashboard.test.tsx` |
| One-off scripts | `src/scripts/migrate-default-resumes.js` |

### Config / packages to drop later (phase 6)

Confirm unused, then remove:

- `@dnd-kit/*` (pipeline kanban)
- `jspdf`, `html2canvas`, `dom-to-image-more`, `file-saver` (job PDF / poster export) — keep `xlsx` if admin bulk upload still needs it
- `@supabase/supabase-js`
- `lovable-tagger` and `cdn.gpteng.co` script in `index.html`
- Recruiter GTM/Clarity/SEO in `index.html`
- Vite `optimizeDeps` for dnd-kit
- `VITE_*_CASHFREE_MODE` only if no admin code reads `cashfreeMode` after cleanup (UsersPage/PlansPage talk to **backend** Cashfree helpers, not this env flag)

## Do not confuse with “recruiter”

These are **admin** features. They mention recruiters because admins manage them:

- Recruiter list and recruiter dashboard under `/admin/recruiters*`
- Company verification under `/admin/management/companies`
- Email send that can target recruiters
- Plans / Cashfree IDs on candidate or recruiter billing records

## Suggested deletion order

1. Unmount routes (phase 3) so the app no longer imports recruiter pages.
2. Delete recruiter/employer directories (phase 4).
3. Grep `recruiter`, `employer`, `getRecruiterMe`, `/recruiter`, `/apply`, `/sign-up`.
4. Run `npm run build` and `npm run lint`.
5. Drop unused npm packages (phase 6).

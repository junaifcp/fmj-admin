# Phase 5 — Public surface and branding

## Goal

The public face of this app is a **private admin sign-in**, not an employer marketing site. Signed-out users never see recruiter pricing, job-apply, or “create an account”.

## Why

The copy still includes recruiter landing, terms, refund, pricing, contact, PWA manifest, GTM, Clarity, and schema.org data aimed at `recruiter.fitmyskill.com`. That is wrong for admin.fitmyskill.com and is a security/SEO smell (admin tools should not be indexed as a hiring product).

## In scope

- Sign-in landing: admin-only copy. No “Don’t have an account? Create one”. No recruiter carousel claims unless they are rewritten for internal admins (prefer a simple branded sign-in).
- Remove or unmount: `LandingPage`, `Index`, `ContactUs`, `TermsConditions`, `PrivacyPolicy`, `RefundPolicy`, `PricingPolicy` if still present.
- `index.html`: admin title; canonical `https://admin.fitmyskill.com/`; `noindex, nofollow`; strip recruiter Open Graph, recruiter JSON-LD, recruiter keywords.
- Remove recruiter GTM / Clarity tags or replace with an admin-specific decision (default: **no marketing tags** on the admin host).
- Remove `cdn.gpteng.co/gptengineer.js`.
- PWA: remove recruiter manifest/name or drop PWA entirely (service worker is already unregistered in `main.tsx`).
- Access-denied and 404 copy should say this is the FitMySkill admin console.
- Footer: no employer legal links unless legal later requires a single privacy line.

## Out of scope

- Clerk production origins and DNS (phase 7).
- Unused npm packages (phase 6).
- Changing admin sidebar labels except where they still say “Go to recruiter product”.

## Public pages after this phase

1. Sign-in (`/` and optionally `/sign-in`)
2. 404
3. Everything else requires admin session

Unsubscribe (`/unsubscribe/:token`) is a **candidate/recruiter email** public page. Default: do **not** host it on admin.fitmyskill.com; it stays on the recruiter (or candidate) host. Confirm with email-template links before deleting the route.

## Depends on

Phase 4 (marketing pages and recruiter components are already gone or safe to delete here).

## Success criteria

- Signed-out homepage is admin sign-in only.
- View-source / `index.html` does not mention recruiter.fitmyskill.com or “AI-Powered Hiring Platform for Employers”.
- `robots` is `noindex`.
- No sign-up CTA.
- Admin sign-in still works.

## Execution plan

Do these steps in order. Do not change `recruiter-frontend`, the backend, Clerk Dashboard, DNS/CORS (phase 7), or npm uninstall (phase 6). Keep `/admin/*` routes and admin email Unsubscribe Management.

**Defaults locked for this phase:** no marketing tags (remove GTM + Clarity); drop PWA entirely; do not host public `/unsubscribe/:token` on this app (delete the page + `unsubscribeApi.ts`; token links stay on recruiter/candidate hosts).

### Current state (after phase 4)

- Routes already public-only: `/`, `/sign-in`, `*` in `src/routes/public.routes.ts`. Legal/landing files are unmounted but still on disk.
- `index.html`: title/OG already say Admin, but robots is still `index, follow`; GTM, Clarity, and gptengineer.js remain.
- `SignInLanding.tsx` still loads `AnimatedCarousel` with hiring/talent copy.
- `public/images/manifest.json` still has Post Job / recruitment shortcuts.
- `Navigation.tsx` still has Sign Up CTAs; only legal pages import it.

### 1. Delete dead public/marketing surface

Delete files (no remaining route imports after phase 3):

- `src/pages/LandingPage.tsx`, `src/pages/Index.tsx`
- `ContactUs.tsx`, `TermsConditions.tsx`, `PrivacyPolicy.tsx`, `RefundPolicy.tsx`, `PricingPolicy.tsx`
- `Unsubscribe.tsx`, `src/services/unsubscribeApi.ts`
- `src/components/Navigation.tsx`
- `src/components/SEO/` (MetaTags + StructuredData; only legal pages used them)
- PWA: `src/components/pwa/`, `src/hooks/usePWAInstall.ts`, `public/images/manifest.json`, `public/sw.js`
- After sign-in rewrite: `src/components/animations/` (AnimatedCarousel + JobAnimations)

Keep: SignInLanding, SignInForm, NotFound, AccessDenied, admin UnsubscribeManagement.

### 2. Harden `index.html` for a private admin host

- Set robots to `noindex, nofollow` (replace `index, follow`).
- Remove GTM head script, GTM noscript body block, and Clarity script.
- Remove gptengineer.js.
- Remove PWA meta and manifest link (keep favicons / theme-color).
- Keep Admin title, description, canonical `https://admin.fitmyskill.com/`, and existing admin JSON-LD.

Clean Clarity typing from `src/global.d.ts` if it only exists for the removed tag. Keep Clerk window typing.

### 3. Simple branded admin sign-in

Rewrite `SignInLanding.tsx` to one composition (no marketing carousel):

- Full-viewport centered layout: FitMySkill Admin as the primary brand signal, one short supporting line about the internal admin console, Clerk SignIn (keep hidden Clerk footer / no sign-up).
- Keep existing auth behavior: redirect admins to `/admin`; non-admins get AccessDenied.
- No footer legal links, no Sign Up CTA, no AnimatedCarousel import.

`SignInForm.tsx` already brands Admin; leave structure, ensure no sign-up copy.

### 4. 404 / Access Denied copy

- `NotFound.tsx`: state this is the FitMySkill Admin console; primary CTA Sign in to `/` or `/sign-in`.
- `AccessDenied.tsx`: keep sign-out-only; tighten wording to FitMySkill Admin if needed.

### 5. Verify

Grep fmj-admin excluding docs/ and node_modules for: `recruiter.fitmyskill.com`, hiring platform phrases, `GTM-`, `clarity`, `gpteng`, `LandingPage`, `sign-up`, Create-account CTAs, hiring carousel strings, Post Job manifest shortcuts. Remaining `recruiter` hits must be admin management only.

Then: `npm run build` and `npm run lint`; browser unsigned `/` is admin sign-in only; legal paths 404; signed-in admin still reaches `/admin`.

### Out of this phase

No npm uninstall / Vite package cleanup (phase 6). No Clerk allowed origins / DNS / CORS (phase 7). No rewrite of admin sidebar product features.

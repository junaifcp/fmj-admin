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

To be written before implementation.

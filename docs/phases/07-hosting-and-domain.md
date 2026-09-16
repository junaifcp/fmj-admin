# Phase 7 — Hosting and domain

## Goal

The admin app is served at **https://admin.fitmyskill.com**, talks to `resume-builder-backend`, and accepts Clerk sessions for admin users only.

## Why

Clerk, CORS, and cookies are origin-bound. Recruiter production hosts are already allowlisted. Admin is a new origin. Shipping the cleaned app without this phase leaves sign-in and API calls broken in production.

## In scope

- Deploy the Vite `dist` the same way as other frontends (Vercel is already sketched in `vercel.json`; match whatever recruiter actually uses if that is S3/CloudFront instead).
- DNS: `admin.fitmyskill.com` → that deployment.
- Clerk (recruiter instance, unless phase 2 chose a dedicated app):
  - Add `http://localhost:8082` and `https://admin.fitmyskill.com` to allowed origins / redirect URLs.
  - Paths: `/` and `/sign-in` as sign-in URLs; `/admin` as after-sign-in.
- Backend CORS on `resume-builder-backend`: allow `http://localhost:8082` and `https://admin.fitmyskill.com`.
- Production env: `VITE_ENV=production`, `VITE_PROD_API_BASE_URL`, `VITE_PROD_CLERK_PUBLISHABLE_KEY`.
- Confirm `vercel.json` SPA rewrite (`/(.*) → /index.html`) still applies.
- Optional: flatten `/admin` to `/` now that the host is admin-only. If you flatten, update AdminLayout hrefs, `admin.routes.ts`, Clerk after-sign-in, and bookmarks. Default: **keep `/admin` for the first production cutover**.
- Optional: after admin.fitmyskill.com is live, stop linking to admin from recruiter-frontend (separate change in that repo).

## Out of scope

- Moving admin **API** routes off `resume-builder-backend`.
- Deleting admin UI from `recruiter-frontend` (cutover task; do it only after this host is verified so admins are not locked out).

## Cutover note (recruiter-frontend)

Until recruiter-frontend’s `/admin` routes are removed, admins can still open the old panel there. That is acceptable for a short overlap. A follow-up in `recruiter-frontend` should redirect `/admin` → `https://admin.fitmyskill.com/admin` (or the flattened path). Track that outside this repo’s phase 1–6.

## Depends on

Phases 1–6 (the artifact you deploy is already admin-only).

## Success criteria

- `https://admin.fitmyskill.com` loads the admin sign-in.
- Admin user can sign in with Clerk and reach the dashboard.
- Recruiter user is denied on this host.
- Authenticated admin API calls (`getAdminMe`, users, recruiters, …) succeed (CORS + bearer token).
- `https://recruiter.fitmyskill.com` is unchanged for recruiters.

## Execution plan

To be written before implementation.

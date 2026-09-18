# Phase 2 — Admin-only authentication

## Goal

Anyone who is not `admin` or `superadmin` cannot use this app. Signed-in recruiters, candidates, and users with no role are denied. There is no self-serve sign-up.

## Why

Today the copied app is a dual-role frontend:

- `SignInLanding` and `SignInForm` redirect recruiters to `/recruiter/dashboard` and admins to `/admin`.
- `AppRoutes` mounts `RecruiterGuard` + `getRecruiterMe` and `AdminGuard` + `getAdminMe`.
- `SignUpForm` creates recruiters (`src/api/recruiter` + referral codes).
- `useRoleAuth` still has recruiter convenience helpers and “recruiter not found” webhook messaging.

On admin.fitmyskill.com that is wrong. A recruiter with a valid Clerk session must not land in an admin shell or a leftover recruiter dashboard.

## In scope

- Sign-in (`/` and `/sign-in`) redirects **only** to the admin dashboard when Clerk role is `admin` or `superadmin`.
- Any other signed-in role sees access denied (and sign-out), not a recruiter redirect.
- Remove `/sign-up` from the public route list (route unmount is enough here; file delete is phase 4).
- Stop capturing recruiter coupons (`checkout_coupon`) and referral codes.
- Keep `AdminGuard` + `getAdminMe` as the source of truth. Clerk metadata is optimistic only.
- Slim `useRoleAuth`: default required roles to admin/superadmin; drop `useRecruiterRoleAuth` usage from this app.
- Rewrite `SignInForm` so it does not call `useRecruiterAuth`.
- Decide Clerk instance (default: **same recruiter Clerk app**, because existing admins already live there). Document the allowed-origin change needed later in phase 7.

## Out of scope

- Deleting recruiter page files (phase 4). Recruiter **routes** can stay mounted until phase 3 if that reduces risk, but they must already be unreachable for non-admins after this phase’s guards/redirects.
- Package cleanup (phase 6).
- Hosting (phase 7).

## Auth rules (required)

1. Not signed in → sign-in page.
2. Signed in, backend `getAdminMe` says admin/superadmin → admin panel.
3. Signed in, Clerk/backend role is recruiter, user, missing, or anything else → access denied. Do not send them to `/recruiter/*`.
4. Backend verify stays on. Do not ship Clerk-metadata-only admin access.
5. No public registration. New admins are created in Clerk (and synced by existing backend webhooks).

## Depends on

Phase 1 (distinct port/identity so you can test without mixing recruiter localhost).

## Success criteria

- Admin test user reaches `/admin` (or the current admin dashboard path).
- Recruiter test user who signs in here is **blocked**, not sent to a recruiter dashboard.
- Candidate/`user` is blocked.
- `/sign-up` is not reachable (404 or redirect to sign-in).
- Access-denied UI offers sign out, not “go to recruiter”.

## Execution plan

Implemented. Clerk instance: **reuse recruiter Clerk** (admins already live there). Phase 7 must add `http://localhost:8082` and `https://admin.fitmyskill.com` as Clerk allowed origins / redirect URLs.

### What changed

1. `SignInLanding` and `SignInForm` redirect only `admin` / `superadmin` to `/admin`. Other signed-in roles see `AccessDenied` with **Sign out**. No recruiter dashboard redirect. No coupon capture. No sign-up CTA.
2. `/sign-up` redirects to `/` (SignUpForm is unmounted, file remains until phase 4).
3. Leftover `/recruiter/*` routes stay mounted until phase 3 but are wrapped in `AdminGuard` + `getAdminMe`, so recruiters cannot enter.
4. `RoleGuard` sends unsigned users to `/sign-in`. Signed-in non-admins get `AccessDenied` (sign out only).
5. `useRoleAuth` defaults to admin/superadmin. `useAdminRoleAuth` calls `getAdminMe`. `useRecruiterRoleAuth` removed.

### Verify

- Unsigned `/` shows sign-in with no “Create one” link.
- `/sign-up` lands on `/`.
- Recruiter session on this host sees Access Denied, not `/recruiter/dashboard`.
- Admin session reaches `/admin` (backend `getAdminMe` still required).

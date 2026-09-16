# Phase 1 — Baseline and identity

## Goal

Make `fmj-admin` identifiable as the admin app and runnable **next to** `recruiter-frontend` without colliding on port, package name, or branding. No recruiter code is deleted in this phase.

## Why this phase first

The folder is a straight copy of the recruiter app: same Vite port `8081`, same `index.html` title (“FitMySkill Recruiter”), same `package.json` name (`vite_react_shadcn_ts`), recruiter allowedHosts, recruiter canonical URL. If those stay, local work and later deploys will fight the recruiter project.

## In scope

- Rename npm package to `fmj-admin`.
- Point root `README.md` at `docs/`.
- Change Vite dev server to **port 8082** (recruiter stays on 8081).
- Replace recruiter `allowedHosts` with localhost plus a placeholder for the admin host.
- Update `index.html` title/description/canonical from recruiter/employer copy to Admin (full SEO strip is phase 5; this phase only stops shipping recruiter identity).
- Confirm `.env.example` documents `VITE_ENV` + API + Clerk keys. Do not invent a new Clerk app yet.
- Confirm the copied app still boots: `npm run dev`, sign-in page loads.

## Out of scope

- Deleting recruiter pages or routes.
- Changing auth so recruiters are blocked (phase 2).
- Domain, CORS, Vercel/CloudFront (phase 7).
- Flattening `/admin` URLs.

## Depends on

Nothing. First phase.

## Success criteria

- `package.json` `name` is `fmj-admin`.
- Dev server binds **8082**, not 8081.
- Browser tab / HTML title is admin-oriented, not “FitMySkill Recruiter”.
- Recruiter-frontend on 8081 and admin on 8082 can run at the same time.
- Existing admin and recruiter routes still exist (this phase does not remove them).

## Execution plan

To be written before implementation.

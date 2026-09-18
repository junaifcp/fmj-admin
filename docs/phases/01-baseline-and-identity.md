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

Do these steps in order. Do not delete recruiter/admin product code, change auth, or edit `recruiter-frontend`. Backend CORS already allows `http://localhost:8082` in `resume-builder-backend/src/app.ts` (allowedOrigins includes `http://localhost:8082`), so no backend change.

### Already done

- Root `README.md` already points at `docs/`. Confirm only; do not rewrite.

### 1. Package name

- `package.json`: change `"name": "vite_react_shadcn_ts"` to `"fmj-admin"`.
- `package-lock.json`: update the top-level `"name"` fields (currently lines 2 and 8) to `fmj-admin` so the lockfile matches. Do not run a full reinstall.

### 2. Dev server identity

In `vite.config.ts`:

- `server.port`: `8081` → `8082`.
- `allowedHosts`: drop `https://recruiter-phi.vercel.app` (wrong host; Vite wants a hostname, not a URL). Use:

```ts
allowedHosts: ["localhost", "127.0.0.1", "admin.fitmyskill.com"]
```

Leave `host: "::"`, Clerk `maxHttpHeaderSize`, plugins, alias, and dnd-kit `optimizeDeps` unchanged (phase 6).

### 3. Stop shipping recruiter HTML identity

Rewrite recruiter/employer strings in `index.html`. Do **not** remove GTM, Clarity, `gptengineer.js`, or change `robots` (phase 5).

Use this copy:

- Title / og:title / twitter:title: `FitMySkill Admin`
- Description: `Internal FitMySkill administration console.`
- Keywords: `FitMySkill, admin`
- Canonical / og:url / twitter:url: `https://admin.fitmyskill.com/`
- og:site_name / apple-mobile-web-app-title: `FitMySkill Admin`
- og:image / twitter:image / schema logo: same paths, host `https://admin.fitmyskill.com/...`
- JSON-LD: `"name"` / `"url"` / `"description"` to Admin + `https://admin.fitmyskill.com`. Drop hiring `featureList` (matching, ATS, interview scheduling) or replace with a short admin list (users, recruiters, taxonomy, email). Keep `applicationCategory` as `BusinessApplication`.

Also retitle PWA identity in `public/images/manifest.json`: `name` / `short_name` / `description` to Admin. Leave `shortcuts` like “Post Job” for phase 5.

Update default props in `src/components/SEO/MetaTags.tsx` so pages that omit props do not still emit recruiter.fitmyskill.com:

- `title`: `FitMySkill Admin`
- `description`: `Internal FitMySkill administration console.`
- `canonicalUrl` / `ogImage`: `https://admin.fitmyskill.com` (and `/images/og-image.jpg`)
- `og:site_name`: `FitMySkill Admin`

Do not edit legal-page canonicals (`TermsConditions`, etc.) in this phase.

### 4. Leftover recruiter README

Delete `README copy.md` (copied recruiter README still saying port 8081). Root README already covers the project.

### 5. Confirm env example (no new Clerk app)

`.env.example` already lists `VITE_ENV` plus per-env API and Clerk keys. Keep Cashfree keys (admin Users/Plans still use Cashfree IDs; env cleanup is phase 6).

Add a short comment that:

- This app reuses the **recruiter Clerk** publishable key (same as `recruiter-frontend`).
- `VITE_DEV_API_BASE_URL` must match the running Node API. Backend default is **port 5001** (`http://localhost:5001/api`), not 3000.

Do not put real keys in `.env.example`. Do not edit `.env`.

### 6. Verify

1. Grep `fmj-admin` (exclude `docs/` and `node_modules`): `8081`, `vite_react_shadcn_ts`, `FitMySkill Recruiter`, `recruiter.fitmyskill.com` in `package.json`, `vite.config.ts`, `index.html`, `MetaTags.tsx`, `manifest.json`. Remaining hits in recruiter pages/legal copy are expected until phases 4–5.
2. `npm run dev` in `fmj-admin` — Vite prints `Local: http://localhost:8082/`. Sign-in page loads. Tab title is admin-oriented.
3. Recruiter routes `/recruiter` and admin `/admin` still exist (no route files changed).
4. Optional: run `recruiter-frontend` on 8081 at the same time to confirm no port clash.

### Out of this phase

No route/auth changes. No CORS/Clerk Dashboard/DNS. No deleting `src/pages/recruiter`. No `noindex` yet.

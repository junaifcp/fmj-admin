# recruiter-frontend

Recruiter + admin UI for FitMySkill. Vite + React + TypeScript. Dev server on **port 8081**. Auth is Clerk with a **recruiter-workspace** key (separate from the candidate app). The browser talks only to `resume-builder-backend` (`VITE_*_API_BASE_URL`).

This is not the resume editor — that lives in `candidate-frontend`.

Agent-oriented notes: [CLAUDE.md](CLAUDE.md). Full docs: [docs/README.md](docs/README.md).

## Commands

```bash
npm run dev          # vite on port 8081
npm run build
npm run build:dev
npm run lint
npm run preview
```

Copy `.env.example`. Switch environments with `VITE_ENV` (`development` | `staging` | `production`). Do not commit `.env`.

## Docs

- [Environment](docs/setup/environment.md)
- [GTM setup](docs/analytics/gtm-setup.md)
- [Candidate dashboard](docs/admin/candidate-dashboard.md)
- [S3 + CloudFront](docs/deployment/s3-cloudfront.md)
- [SSH reverse tunnel](docs/ops/ssh-tunnel.md)

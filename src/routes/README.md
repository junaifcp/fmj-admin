# Route Configuration

Centralized routing for the FitMySkill **admin** app. The router only knows public sign-in and the admin panel.

## Structure

```
routes/
├── index.tsx           # AppRoutes renderer
├── types.ts            # RouteConfig types
├── paths.ts            # PATHS.HOME, PATHS.SIGN_IN, PATHS.ADMIN
├── public.routes.ts    # /, /sign-in, *
├── admin.routes.ts     # /admin/* behind AdminGuard
└── README.md
```

## Public routes

| Path | Page |
| --- | --- |
| `/` | Sign-in landing |
| `/sign-in` | Sign-in form |
| `*` | Not found |

## Admin routes

All `/admin/*` routes live in `admin.routes.ts`, wrapped with `AdminGuard` + `getAdminMe` in `index.tsx`. Keep the `/admin` prefix.

Add a page:

1. Create the component under `src/pages/admin/`.
2. Register it in `admin.routes.ts`.
3. Add a constant to `PATHS.ADMIN` in `paths.ts` if you will navigate to it from code.
4. Prefer `PATHS` over hardcoded strings.

```typescript
import { PATHS } from "@/routes/paths";

navigate(PATHS.ADMIN.DASHBOARD);
<Link to={PATHS.ADMIN.USERS}>Users</Link>
```

Do not add recruiter, employer, public-apply, or sign-up routes here. Those belong in `recruiter-frontend`.

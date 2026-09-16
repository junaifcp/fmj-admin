# Route Configuration

This directory contains the centralized route configuration for the application, providing better organization, scalability, and maintainability.

## Structure

```
routes/
├── index.tsx           # Main routes renderer and exports
├── types.ts            # TypeScript types for route configuration
├── paths.ts            # Centralized route path constants
├── public.routes.ts    # Public/unauthenticated routes
├── recruiter.routes.ts # Recruiter-specific routes
├── admin.routes.ts     # Admin-specific routes
└── README.md           # This file
```

## Benefits

### 1. **Better Organization**

- Routes are grouped by feature (public, recruiter, admin)
- Easy to find and modify specific route groups
- Clear separation of concerns

### 2. **Scalability**

- Adding new routes is simple - just add to the appropriate file
- No need to modify App.tsx for route changes
- Easy to add new route groups

### 3. **Type Safety**

- Centralized path constants prevent typos
- TypeScript ensures route configuration is correct
- Autocomplete for route paths

### 4. **Maintainability**

- Change route paths in one place
- Consistent route protection logic
- Easy to refactor and update

### 5. **Performance**

- Lazy loading configured per route group
- Prefetch hints for critical routes
- Shared loading states

## Usage

### Adding a New Route

#### Public Route

Edit `public.routes.ts`:

```typescript
import { lazy } from "react";

const MyNewPage = lazy(() => import("@/pages/MyNewPage"));

export const publicRoutes: RouteConfig[] = [
  // ... existing routes
  {
    path: "/my-new-page",
    element: MyNewPage,
  },
];
```

#### Protected Route (Recruiter)

Edit `recruiter.routes.ts`:

```typescript
const MyRecruiterPage = lazy(() => import("@/pages/recruiter/MyPage"));

export const recruiterLayoutRoutes: RouteConfig = {
  // ...
  children: [
    // ... existing children
    {
      path: "my-page",
      element: MyRecruiterPage,
    },
  ],
};
```

#### Admin Route

Edit `admin.routes.ts` similarly to recruiter routes.

### Using Route Paths

Instead of hardcoded strings, import from `paths.ts`:

```typescript
import { PATHS } from "@/routes/paths";
import { useNavigate } from "react-router-dom";

function MyComponent() {
  const navigate = useNavigate();

  const goToDashboard = () => {
    navigate(PATHS.RECRUITER.DASHBOARD);
  };

  const goToJobDetails = (jobId: string) => {
    navigate(PATHS.RECRUITER.JOB_DETAILS(jobId));
  };

  return <Link to={PATHS.RECRUITER.JOBS}>View Jobs</Link>;
}
```

### Route Protection

Routes are automatically protected based on their configuration:

```typescript
{
  path: "/recruiter/profile",
  element: RecruiterProfile,
  protected: true, // Will wrap with RecruiterRoute
}
```

## File Descriptions

### `types.ts`

Defines TypeScript interfaces for route configuration:

- `RouteConfig`: Configuration for a single route
- `RouteGroup`: Configuration for a group of routes with shared wrapper

### `paths.ts`

Centralized path constants organized by feature:

- Prevents hardcoded path strings throughout the app
- Type-safe path building
- Easy to update paths in one place

### `public.routes.ts`

Public routes accessible to all users:

- Landing pages
- Auth pages (sign in/up)
- Legal pages (terms, privacy, etc.)

### `recruiter.routes.ts`

Recruiter-specific routes:

- `recruiterStandaloneRoutes`: Routes outside the main layout (checkout, payment success, etc.)
- `recruiterLayoutRoutes`: Routes within the RecruiterLayout

### `admin.routes.ts`

Admin-specific routes:

- All routes within AdminLayout
- Management sub-routes

### `index.tsx`

Main route renderer:

- Combines all route configurations
- Handles route protection logic
- Provides suspense fallback
- Exports `AppRoutes` component used in App.tsx

## Migration Guide

If you have hardcoded paths in your components, replace them:

**Before:**

```typescript
navigate("/recruiter/dashboard");
<Link to="/recruiter/jobs">Jobs</Link>;
```

**After:**

```typescript
import { PATHS } from "@/routes/paths";

navigate(PATHS.RECRUITER.DASHBOARD);
<Link to={PATHS.RECRUITER.JOBS}>Jobs</Link>;
```

## Best Practices

1. **Always use path constants** from `paths.ts` instead of hardcoded strings
2. **Group related routes** in the same file
3. **Use lazy loading** for all route components
4. **Add prefetch hints** for critical routes: `import(/* webpackPrefetch: true */ "...")`
5. **Keep route protection logic** in the route configuration, not in components
6. **Update paths.ts** when adding new routes for easy navigation

## Example: Adding a New Feature

Let's say you want to add a new "Reports" feature for recruiters:

1. **Create the page component:**

   ```bash
   touch src/pages/recruiter/Reports.tsx
   ```

2. **Add to `recruiter.routes.ts`:**

   ```typescript
   const RecruiterReports = lazy(() => import("@/pages/recruiter/Reports"));

   export const recruiterLayoutRoutes: RouteConfig = {
     // ...
     children: [
       // ...
       {
         path: "reports",
         element: RecruiterReports,
       },
     ],
   };
   ```

3. **Add to `paths.ts`:**

   ```typescript
   export const PATHS = {
     RECRUITER: {
       // ...
       REPORTS: "/recruiter/reports",
     },
   };
   ```

4. **Use in navigation:**
   ```typescript
   import { PATHS } from "@/routes/paths";
   <Link to={PATHS.RECRUITER.REPORTS}>Reports</Link>;
   ```

Done! No need to touch App.tsx or any other routing files.

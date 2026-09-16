// src/examples/auth-usage-examples.tsx

/**
 * This file contains practical examples of using the new authentication system.
 * Copy and adapt these examples for your own use cases.
 */

import React from "react";
import {
  RoleGuard,
  RecruiterGuard,
  AdminGuard,
} from "@/components/auth/RoleGuard";
import {
  PermissionGate,
  usePermission,
  useRole,
} from "@/components/auth/PermissionGate";
import { useImprovedAuth } from "@/context/ImprovedAuthContext";
import { useRoleAuth } from "@/hooks/useRoleAuth";
import { UserRole, Permission } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { getAdminMe } from "@/api/admin";
import { getRecruiterMe } from "@/api/recruiter";

// ============================================================
// Example 1: Protecting Routes with RoleGuard
// ============================================================

export const RecruiterDashboardRoute = () => {
  return (
    <RecruiterGuard backendVerify={getRecruiterMe}>
      <RecruiterDashboard />
    </RecruiterGuard>
  );
};

export const AdminPanelRoute = () => {
  return (
    <AdminGuard backendVerify={getAdminMe}>
      <AdminPanel />
    </AdminGuard>
  );
};

// Custom role combination
export const ManagerRoute = () => {
  return (
    <RoleGuard
      requiredRoles={[UserRole.ADMIN, UserRole.SUPERADMIN]}
      backendVerify={getAdminMe}
      showAccessDenied={true}
    >
      <ManagerDashboard />
    </RoleGuard>
  );
};

// ============================================================
// Example 2: Permission-Based UI Elements
// ============================================================

export const JobActionsExample = () => {
  return (
    <div className="flex gap-2">
      {/* Show edit button only if user has permission */}
      <PermissionGate permissions={[Permission.EDIT_JOB]}>
        <Button variant="outline">Edit Job</Button>
      </PermissionGate>

      {/* Show delete button only if user has permission */}
      <PermissionGate permissions={[Permission.DELETE_JOB]}>
        <Button variant="destructive">Delete Job</Button>
      </PermissionGate>

      {/* Show with fallback for users without permission */}
      <PermissionGate
        permissions={[Permission.VIEW_ANALYTICS]}
        fallback={
          <Button disabled variant="ghost">
            Analytics (Premium Only)
          </Button>
        }
      >
        <Button>View Analytics</Button>
      </PermissionGate>
    </div>
  );
};

// ============================================================
// Example 3: Using Auth Context Directly
// ============================================================

export const UserProfileExample = () => {
  const {
    user,
    role,
    permissions,
    hasRole,
    hasPermission,
    isAuthenticated,
    isLoading,
  } = useImprovedAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }

  return (
    <div className="space-y-4">
      <h1>Profile</h1>
      <p>Email: {user?.email}</p>
      <p>Role: {role}</p>

      {/* Conditional rendering based on role */}
      {hasRole(UserRole.RECRUITER, UserRole.ADMIN) && (
        <div className="bg-blue-50 p-4 rounded">
          <p>You have recruiter or admin access!</p>
        </div>
      )}

      {/* Conditional rendering based on permission */}
      {hasPermission(Permission.MANAGE_USERS) && <Button>Manage Users</Button>}

      {/* Show all user permissions */}
      <div>
        <h3>Your Permissions:</h3>
        <ul>
          {permissions.map((perm) => (
            <li key={perm}>{perm}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// ============================================================
// Example 4: Using Permission Hooks
// ============================================================

export const ConditionalButtonExample = () => {
  const canPostJob = usePermission(Permission.POST_JOB);
  const canDeleteJob = usePermission(Permission.DELETE_JOB);
  const isAdmin = useRole(UserRole.ADMIN, UserRole.SUPERADMIN);

  const handlePostJob = () => {
    if (!canPostJob) {
      alert("You don't have permission to post jobs");
      return;
    }
    // Post job logic
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handlePostJob} disabled={!canPostJob}>
        {canPostJob ? "Post New Job" : "Upgrade to Post Jobs"}
      </Button>

      {canDeleteJob && <Button variant="destructive">Delete</Button>}

      {isAdmin && <Button variant="outline">Admin Tools</Button>}
    </div>
  );
};

// ============================================================
// Example 5: Using useRoleAuth Hook Directly
// ============================================================

export const CustomAuthCheckExample = () => {
  const { hasRole, checking, user, error } = useRoleAuth({
    requiredRoles: [UserRole.RECRUITER],
    backendVerify: getRecruiterMe,
  });

  if (checking) {
    return <div>Verifying access...</div>;
  }

  if (error || !hasRole) {
    return <div>Access denied: {error}</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.email}!</h1>
      <p>Role: {user?.role}</p>
    </div>
  );
};

// ============================================================
// Example 6: Role-Based Navigation
// ============================================================

export const NavigationExample = () => {
  const { hasRole, role } = useImprovedAuth();

  return (
    <nav className="flex gap-4">
      <a href="/">Home</a>

      {/* Show for all authenticated users */}
      {role && <a href="/profile">Profile</a>}

      {/* Show only for recruiters */}
      {hasRole(UserRole.RECRUITER) && (
        <>
          <a href="/recruiter/dashboard">Dashboard</a>
          <a href="/recruiter/jobs">Jobs</a>
          <a href="/recruiter/candidates">Candidates</a>
        </>
      )}

      {/* Show only for admins */}
      {hasRole(UserRole.ADMIN, UserRole.SUPERADMIN) && (
        <>
          <a href="/admin">Admin Panel</a>
          <a href="/admin/users">Manage Users</a>
        </>
      )}
    </nav>
  );
};

// ============================================================
// Example 7: Complex Permission Logic
// ============================================================

export const ComplexPermissionExample = () => {
  const { hasPermission, hasAnyPermission, role } = useImprovedAuth();

  // User must have ALL these permissions
  const canManageEverything = hasPermission(
    Permission.MANAGE_USERS,
    Permission.MANAGE_RECRUITERS
  );

  // User must have AT LEAST ONE of these permissions
  const canViewSomeData = hasAnyPermission(
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_APPLICATIONS
  );

  return (
    <div className="space-y-4">
      {canManageEverything && (
        <div className="bg-green-50 p-4 rounded">
          <p>Full Management Access</p>
        </div>
      )}

      {canViewSomeData && (
        <div className="bg-blue-50 p-4 rounded">
          <p>You can view some analytics or applications</p>
        </div>
      )}

      {/* Nested permissions */}
      <PermissionGate permissions={[Permission.POST_JOB]}>
        <div>
          <Button>Create Job</Button>

          {/* Only show if user can also delete */}
          <PermissionGate permissions={[Permission.DELETE_JOB]}>
            <Button variant="outline" className="ml-2">
              Manage All Jobs
            </Button>
          </PermissionGate>
        </div>
      </PermissionGate>
    </div>
  );
};

// ============================================================
// Example 8: Form with Permission Checks
// ============================================================

export const JobFormExample = () => {
  const canEditJob = usePermission(Permission.EDIT_JOB);
  const canDeleteJob = usePermission(Permission.DELETE_JOB);

  const handleSubmit = (data: any) => {
    if (!canEditJob) {
      alert("You don't have permission to edit jobs");
      return;
    }
    // Submit logic
  };

  const handleDelete = () => {
    if (!canDeleteJob) {
      alert("You don't have permission to delete jobs");
      return;
    }
    // Delete logic
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <input type="text" placeholder="Job Title" />
      <input type="text" placeholder="Description" />

      <div className="flex gap-2 mt-4">
        <Button type="submit" disabled={!canEditJob}>
          {canEditJob ? "Save Changes" : "View Only"}
        </Button>

        {canDeleteJob && (
          <Button type="button" variant="destructive" onClick={handleDelete}>
            Delete Job
          </Button>
        )}
      </div>
    </form>
  );
};

// ============================================================
// Example 9: Table with Row-Level Permissions
// ============================================================

export const UserTableExample = ({ users }: { users: any[] }) => {
  const canEditUser = usePermission(Permission.MANAGE_USERS);
  const canDeleteUser = usePermission(Permission.MANAGE_USERS);

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          {canEditUser && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            {canEditUser && (
              <td>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
                {canDeleteUser && (
                  <Button size="sm" variant="destructive" className="ml-2">
                    Delete
                  </Button>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// ============================================================
// Example 10: Dashboard with Multiple Permission Sections
// ============================================================

export const DashboardExample = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Jobs section - visible to recruiters */}
      <PermissionGate permissions={[Permission.VIEW_JOBS]}>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3>My Jobs</h3>
          <p>You have 5 active job postings</p>
        </div>
      </PermissionGate>

      {/* Analytics - visible to admins and premium recruiters */}
      <PermissionGate
        permissions={[Permission.VIEW_ANALYTICS]}
        fallback={
          <div className="bg-gray-100 p-6 rounded-lg">
            <h3>Analytics</h3>
            <p>Upgrade to access analytics</p>
            <Button size="sm">Upgrade Now</Button>
          </div>
        }
      >
        <div className="bg-white p-6 rounded-lg shadow">
          <h3>Analytics</h3>
          <p>1,234 views this month</p>
        </div>
      </PermissionGate>

      {/* User management - admin only */}
      <PermissionGate permissions={[Permission.MANAGE_USERS]}>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3>User Management</h3>
          <p>Manage all users</p>
          <Button size="sm">View Users</Button>
        </div>
      </PermissionGate>
    </div>
  );
};

// ============================================================
// Dummy Components (for example purposes)
// ============================================================

const RecruiterDashboard = () => <div>Recruiter Dashboard</div>;
const AdminPanel = () => <div>Admin Panel</div>;
const ManagerDashboard = () => <div>Manager Dashboard</div>;

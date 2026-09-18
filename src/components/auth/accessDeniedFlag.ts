// Set by RoleGuard right before signing out a JWT session whose Mongo role
// isn't admin/superadmin; read-and-cleared by the sign-in pages. Lives in
// sessionStorage (not router state) so it survives AuthProvider.signOut's
// hard redirect. Generic on purpose — never reveals the real role.
export const ACCESS_DENIED_FLAG = "admin:access_denied";

export const ACCESS_DENIED_MESSAGE =
  "You don't have access to this console. Sign in with an administrator account.";

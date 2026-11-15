// Employer admin 4.1: send an old URL to its new path, keeping ?query and #hash.
import { Navigate, useLocation } from "react-router-dom";

export function redirectWithQuery(to: string) {
  const RedirectWithQuery = () => {
    const { search, hash } = useLocation();
    return <Navigate to={`${to}${search}${hash}`} replace />;
  };
  return RedirectWithQuery;
}

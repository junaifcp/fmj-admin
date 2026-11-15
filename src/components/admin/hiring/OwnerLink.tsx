// Employer admin 4.1: an owner's name links to Recruiter Detail or Employer
// Detail by role. Employers are plain text until Employer Detail ships (6.2).
import React from "react";
import { Link } from "react-router-dom";
import { ownerDetailPath } from "@/routes/paths";

interface OwnerLinkProps {
  id?: string | null;
  role?: string | null;
  children: React.ReactNode;
  className?: string;
}

const OwnerLink: React.FC<OwnerLinkProps> = ({ id, role, children, className }) => {
  const href = id ? ownerDetailPath(role, id) : null;
  if (!href) return <span className={className}>{children}</span>;
  return (
    <Link
      to={href}
      className={`text-primary hover:underline ${className ?? ""}`.trim()}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </Link>
  );
};

export default OwnerLink;

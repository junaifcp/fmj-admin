// src/components/shared/VerifiedBadge.tsx
// Candidate verification 7.1: shown beside a lead's name only when the
// API says identityVerified is true. Pending and unverified render nothing.
// Shield copied from candidate-frontend's ShieldIcon so the mark matches.
import React from "react";

export const VerifiedBadge: React.FC<{ verified?: boolean }> = ({ verified }) => {
  if (verified !== true) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M12 2.75 4.75 5.6v5.65c0 4.5 3.05 8.4 7.25 9.95 4.2-1.55 7.25-5.45 7.25-9.95V5.6L12 2.75Z"
          fill="currentColor"
          fillOpacity={0.15}
        />
        <path d="m8.75 12.1 2.3 2.3 4.2-4.6" />
      </svg>
      Verified
    </span>
  );
};

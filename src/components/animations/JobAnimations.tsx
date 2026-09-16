import React from "react";

/**
 * Three small reusable SVG animations related to hiring / interview / talent search.
 * Each component is self-contained (styling & animation inlined inside the SVG)
 * and sets aria-hidden="true" so screen readers ignore them.
 */

/* ------------------------------- HiringAnimation ------------------------------- */
export const HiringAnimation: React.FC<{ size?: number }> = ({
  size = 240,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="hireGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      {/* background circle */}
      <circle cx="120" cy="120" r="110" fill="url(#hireGrad)" opacity="0.08" />

      {/* Resume card */}
      <g transform="translate(40,44)">
        <rect
          x="0"
          y="0"
          width="160"
          height="120"
          rx="10"
          fill="#fff"
          stroke="#E6EEF6"
        />
        <rect x="14" y="12" width="64" height="64" rx="8" fill="#F8FAFC" />
        <rect x="86" y="16" width="58" height="10" rx="4" fill="#EEF2FF" />
        <rect x="86" y="34" width="110" height="10" rx="4" fill="#EEF2FF" />
        <rect x="86" y="52" width="80" height="10" rx="4" fill="#EEF2FF" />
      </g>

      {/* Sparkle cluster */}
      <g transform="translate(176,30)">
        <g className="spark" transform="scale(1)">
          <rect x="-6" y="-6" width="12" height="12" rx="2" fill="#FDE68A" />
        </g>
      </g>

      {/* small pulse dots (applicant flow) */}
      <g transform="translate(36,184)">
        <circle className="dot" cx="0" cy="0" r="6" fill="#7C3AED" />
        <circle className="dot" cx="28" cy="0" r="6" fill="#06B6D4" />
        <circle className="dot" cx="56" cy="0" r="6" fill="#F59E0B" />
      </g>

      <style>{`
        .spark { transform-origin:center; animation: sparkPop 1.6s infinite ease-in-out; }
        @keyframes sparkPop {
          0% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0.6; }
        }

        .dot { transform-origin:center; animation: dotWave 1s infinite ease-in-out; }
        .dot:nth-child(2) { animation-delay: 0.12s; }
        .dot:nth-child(3) { animation-delay: 0.24s; }
        @keyframes dotWave {
          0% { transform: translateY(0); opacity: 0.9; }
          50% { transform: translateY(-8px); opacity: 1; }
          100% { transform: translateY(0); opacity: 0.9; }
        }
      `}</style>
    </svg>
  );
};

/* ------------------------------- InterviewAnimation ------------------------------- */
export const InterviewAnimation: React.FC<{ size?: number }> = ({
  size = 240,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="intGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>

      <rect
        x="0"
        y="0"
        width="240"
        height="240"
        rx="28"
        fill="#fff"
        opacity="0.02"
      />

      {/* two stylized avatars + chat bubble representing an interview */}
      <g transform="translate(36,36)">
        {/* interviewer */}
        <g transform="translate(0,0)">
          <circle cx="28" cy="28" r="22" fill="#F8FAFC" stroke="#E6EEF6" />
          <rect x="8" y="62" width="40" height="18" rx="6" fill="#EEF2FF" />
        </g>

        {/* interviewee */}
        <g transform="translate(84,0)">
          <circle cx="28" cy="28" r="22" fill="#fff" stroke="#E6EEF6" />
          <rect x="8" y="62" width="40" height="18" rx="6" fill="#F8FAFC" />
        </g>

        {/* animated chat bubble */}
        <g transform="translate(30,96)">
          <path
            d="M0 8 a8 8 0 0 1 8 -8 h80 a8 8 0 0 1 8 8 v32 a8 8 0 0 1 -8 8 h-60 l-12 12 v-12 h-8 a8 8 0 0 1 -8 -8 z"
            fill="url(#intGrad)"
            opacity="0.95"
          />
          <rect x="18" y="8" width="48" height="6" rx="3" fill="#fff" />
          <rect x="18" y="20" width="28" height="6" rx="3" fill="#fff" />
          <g className="chatPulse" transform="translate(100,14)">
            <circle r="4" fill="#fff" opacity="0.9" />
          </g>
        </g>
      </g>

      <style>{`
        .chatPulse {
          transform-origin: center;
          animation: chatPulse 1.2s infinite ease-in-out;
        }
        @keyframes chatPulse {
          0% { transform: translateY(0) scale(1); opacity: 0.9;}
          50% { transform: translateY(-6px) scale(1.06); opacity: 1;}
          100% { transform: translateY(0) scale(1); opacity: 0.9;}
        }
      `}</style>
    </svg>
  );
};

/* ------------------------------- TalentSearchAnimation ------------------------------- */
export const TalentSearchAnimation: React.FC<{ size?: number }> = ({
  size = 240,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="findGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      <rect
        x="0"
        y="0"
        width="240"
        height="240"
        rx="28"
        fill="#fff"
        opacity="0.02"
      />

      {/* magnifier */}
      <g transform="translate(32,32)" className="magnifier">
        <circle cx="80" cy="80" r="46" fill="#F8FAFC" stroke="#E6EEF6" />
        <rect
          x="120"
          y="120"
          width="48"
          height="12"
          rx="6"
          transform="rotate(28 120 120)"
          fill="url(#findGrad)"
        />
        {/* candidate dots around lens */}
        <g transform="translate(80,80)" className="dots">
          <circle cx="-34" cy="-10" r="6" fill="#06B6D4" />
          <circle cx="-4" cy="-36" r="6" fill="#7C3AED" />
          <circle cx="28" cy="-8" r="6" fill="#10B981" />
          <circle cx="6" cy="28" r="6" fill="#F59E0B" />
        </g>
      </g>

      {/* search beam */}
      <rect
        x="24"
        y="176"
        width="192"
        height="8"
        rx="4"
        fill="url(#findGrad)"
        className="beam"
      />

      <style>{`
        .magnifier { transform-origin: center; animation: float 6s infinite ease-in-out; }
        @keyframes float {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }

        .dots { transform-origin: center; animation: orbit 3.6s infinite linear; }
        @keyframes orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .beam { animation: beamPulse 1.8s infinite ease-in-out; }
        @keyframes beamPulse {
          0% { opacity: 0.7; transform: scaleX(0.98); }
          50% { opacity: 1; transform: scaleX(1.02); }
          100% { opacity: 0.7; transform: scaleX(0.98); }
        }
      `}</style>
    </svg>
  );
};

export default {
  HiringAnimation,
  InterviewAnimation,
  TalentSearchAnimation,
};

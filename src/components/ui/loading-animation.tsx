import React from "react";

/**
 * A lightweight animated SVG loader for AI generation or async tasks.
 * Displays subtle document + sparkles animation with wave dots.
 */
export const LoadingAnimation: React.FC<{ label?: string }> = ({
  label = "Generating AI suggestions",
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 py-6"
    >
      {/* Animated SVG - stylized "sparkles + document" */}
      <svg
        width="160"
        height="120"
        viewBox="0 0 160 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#06B6D4" />
          </linearGradient>
        </defs>

        {/* Paper */}
        <rect
          x="28"
          y="12"
          width="104"
          height="96"
          rx="6"
          fill="#F8FAFC"
          stroke="#E6EEF6"
        />
        {/* Lines */}
        <rect x="42" y="26" width="76" height="6" rx="3" fill="#E6EEF6" />
        <rect x="42" y="38" width="88" height="6" rx="3" fill="#EEF2FF" />
        <rect x="42" y="50" width="62" height="6" rx="3" fill="#EEF2FF" />
        <rect x="42" y="62" width="48" height="6" rx="3" fill="#EEF2FF" />

        {/* Sparkles - animated scale/opacity */}
        <g transform="translate(18,18)">
          <g className="spark" transform="translate(0,0)">
            <circle cx="0" cy="0" r="3" fill="url(#g)" opacity="0.95" />
          </g>
        </g>

        <g transform="translate(138,24)">
          <g className="spark" transform="translate(0,0)">
            <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#FDE68A" />
          </g>
        </g>

        <g transform="translate(120,92)">
          <g className="spark" transform="translate(0,0)">
            <polygon
              points="0,-4 1,-1 4,0 1,1 0,4 -1,1 -4,0 -1,-1"
              fill="#A7F3D0"
            />
          </g>
        </g>

        {/* Animated dot row */}
        <g transform="translate(42,86)">
          <circle className="dot" cx="0" cy="0" r="3" fill="#7C3AED" />
          <circle className="dot" cx="18" cy="0" r="3" fill="#06B6D4" />
          <circle className="dot" cx="36" cy="0" r="3" fill="#F59E0B" />
        </g>

        <style>{`
          /* Spark scale + fade */
          .spark {
            transform-origin: center;
            animation: sparkPop 1.6s infinite ease-in-out;
          }
          @keyframes sparkPop {
            0% { transform: scale(0.85); opacity: 0.6; }
            50% { transform: scale(1.35); opacity: 1; }
            100% { transform: scale(0.85); opacity: 0.6; }
          }

          /* Dot wave */
          .dot {
            transform-origin: center;
            animation: dotWave 1s infinite ease-in-out;
          }
          .dot:nth-child(2) {
            animation-delay: 0.12s;
          }
          .dot:nth-child(3) {
            animation-delay: 0.24s;
          }
          @keyframes dotWave {
            0% { transform: translateY(0); opacity: 0.9; }
            50% { transform: translateY(-10px); opacity: 1; }
            100% { transform: translateY(0); opacity: 0.9; }
          }
        `}</style>
      </svg>

      <div className="text-sm text-muted-foreground">{label}…</div>
    </div>
  );
};

export default LoadingAnimation;

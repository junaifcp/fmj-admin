// Copied unchanged from employer-frontend/src/lib/cvDropPoster/layout.ts so admin's
// "Download CV drop" (Hiring → Companies) prints the exact poster the employer
// gets. Change both copies together.
// Employer CV drop poster 3.1 — every position, size, colour, and font of the
// poster, in design units on a 1024 × 1536 canvas (text y = baseline).
// Source: docs/employer-cv-drop-poster/assets/poster-layout.json, with the
// differences in docs/employer-cv-drop-poster/locked-decisions.md.

export const DESIGN_WIDTH = 1024;
export const DESIGN_HEIGHT = 1536;
/** The PNG is the design drawn at 2× (2048 × 3072) for print. */
export const EXPORT_SCALE = 2;

export const COLORS = {
  yellow: "#FDD40F",
  navy: "#0A2547",
  white: "#FFFFFF",
  dividerNavy: "rgba(10,37,71,0.5)",
  dividerWhite: "rgba(255,255,255,0.35)",
  qrDark: "#000000",
  qrLight: "#FFFFFF",
} as const;

/** Unique family names so the poster never picks up a global "Poppins" or "Cinzel". */
export const FONT_HEADLINE = "CvDropPosterPoppins";
export const FONT_SERIF = "CvDropPosterCinzel";

export interface TextStyle {
  family: string;
  weight: 400 | 700 | 800;
  size: number;
  /** Extra space between characters, design units. */
  letterSpacing: number;
  color: string;
}

/** Company logo: fit inside, keep aspect ratio, centre, no crop. */
export const LOGO_BOX = { x: 292, y: 30, width: 440, height: 260 } as const;

export interface WordmarkVariant {
  size: number;
  minSize: number;
  baseline: number;
  maxWidth: number;
  /** Baselines when the name needs two lines (both lines at minSize). */
  twoLineBaselines: readonly [number, number];
}

/** Company name, uppercased, Cinzel 400, navy, centred. */
export const WORDMARK = {
  centerX: 512,
  family: FONT_SERIF,
  weight: 400,
  color: COLORS.navy,
  /** Letter spacing is 4 at 64 px and scales with the size. */
  letterSpacingPerPx: 4 / 64,
  shrinkStep: 2,
} as const;

export const WORDMARK_WITH_LOGO: WordmarkVariant = {
  size: 64,
  minSize: 40,
  baseline: 350,
  maxWidth: 860,
  twoLineBaselines: [340, 388],
};

/** No logo: the name moves up and grows to fill the top. */
export const WORDMARK_NO_LOGO: WordmarkVariant = {
  size: 84,
  minSize: 48,
  baseline: 230,
  maxWidth: 900,
  twoLineBaselines: [200, 262],
};

const headline = (size: number, letterSpacing: number): TextStyle => ({
  family: FONT_HEADLINE,
  weight: 800,
  size,
  letterSpacing,
  color: COLORS.navy,
});

/** Fixed copy, centred on x. */
export const HEADLINE_LINE_1 = { text: "Looking for a", x: 518, y: 497, style: headline(98, -3) };
export const HEADLINE_LINE_2 = { text: "Job?", x: 490, y: 700, style: headline(260, -10) };
export const SUB_HEADLINE = { text: "Drop Your CV Here", x: 515, y: 765, style: headline(56, -2) };

/** Accent lines sit just right of the drawn "Job?", not at a fixed x. */
export const ACCENT_LINES = { width: 100, height: 92, top: 580, gapAfterJob: 16, maxRight: 1004 } as const;

export const QR_FRAME = { x: 282, y: 792, width: 460, height: 380 } as const;

/** Square QR centred in the frame's safe area; 1-module white margin inside the box. */
export const QR_CODE = { x: 352, y: 816, size: 320, marginModules: 1, errorCorrectionLevel: "M" } as const;

export type FeatureIcon = "upload" | "noticed" | "team";

export const FEATURES: readonly {
  icon: FeatureIcon;
  cx: number;
  lines: readonly [string, string];
}[] = [
  { icon: "upload", cx: 238, lines: ["Upload", "Your CV"] },
  { icon: "noticed", cx: 512, lines: ["Get", "Noticed"] },
  { icon: "team", cx: 785, lines: ["Be Part of", "Our Team"] },
];
export const FEATURE_CIRCLE = { cy: 1226, r: 53, color: COLORS.yellow } as const;
export const FEATURE_ICON_SIZE = 64;
export const FEATURE_LABEL = { baselines: [1314, 1347] as const, style: headline(30, -1) };
export const FEATURE_DIVIDERS = {
  color: COLORS.dividerNavy,
  width: 1.5,
  lines: [
    { x: 375, y1: 1205, y2: 1335 },
    { x: 651, y1: 1205, y2: 1335 },
  ],
} as const;

export const FOOTER_BAR = { x: 72, y: 1367, width: 878, height: 125, radius: 45, color: COLORS.navy } as const;
export const POWERED_BY = {
  text: "Powered by",
  /** Right-aligned at x. */
  x: 502,
  y: 1444,
  style: { family: FONT_HEADLINE, weight: 700, size: 28, letterSpacing: -0.5, color: COLORS.white } as TextStyle,
};
export const FOOTER_DIVIDER = { x: 527, y1: 1402, y2: 1464, color: COLORS.dividerWhite, width: 1.5 } as const;

/** FitMyJob logo drawn with shapes and text inside a 124 × 102 box (see locked decisions). */
export const FITMYJOB_LOGO = {
  x: 550,
  y: 1381,
  card: { dx: 1.5, dy: 1.5, width: 121, height: 99, radius: 11, fill: COLORS.navy, stroke: COLORS.yellow, strokeWidth: 2 },
  fitMy: { dx: 17, baselineDy: 40, size: 25 },
  job: { centerDx: 62, baselineDy: 86, size: 44 },
} as const;

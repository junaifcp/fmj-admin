// Copied unchanged from employer-frontend/src/lib/cvDropPoster/render.ts so admin's
// "Download CV drop" (Hiring → Companies) prints the exact poster the employer
// gets. Change both copies together.
// Employer CV drop poster 3.1 — draws the "Looking for a Job? Drop Your CV Here"
// poster on a canvas and returns a 2048 × 3072 PNG. Everything is drawn in
// design units (1024 × 1536) with ctx.scale(EXPORT_SCALE); see ./layout.ts.
// Decisions: docs/employer-cv-drop-poster/locked-decisions.md
import QRCode from "qrcode";
import backgroundUrl from "@/assets/cv-drop-poster/background-shapes.svg?url";
import accentLinesUrl from "@/assets/cv-drop-poster/accent-burst-lines.svg?url";
import qrFrameUrl from "@/assets/cv-drop-poster/qr-frame.svg?url";
import iconUploadUrl from "@/assets/cv-drop-poster/icon-upload-cv.svg?url";
import iconNoticedUrl from "@/assets/cv-drop-poster/icon-get-noticed.svg?url";
import iconTeamUrl from "@/assets/cv-drop-poster/icon-team-briefcase.svg?url";
import { loadPosterFonts } from "./fonts";
import {
  ACCENT_LINES,
  COLORS,
  DESIGN_HEIGHT,
  DESIGN_WIDTH,
  EXPORT_SCALE,
  FEATURES,
  FEATURE_CIRCLE,
  FEATURE_DIVIDERS,
  FEATURE_ICON_SIZE,
  FEATURE_LABEL,
  FITMYJOB_LOGO,
  FONT_HEADLINE,
  FOOTER_BAR,
  FOOTER_DIVIDER,
  HEADLINE_LINE_1,
  HEADLINE_LINE_2,
  LOGO_BOX,
  POWERED_BY,
  QR_CODE,
  QR_FRAME,
  SUB_HEADLINE,
  WORDMARK,
  WORDMARK_NO_LOGO,
  WORDMARK_WITH_LOGO,
  type FeatureIcon,
  type TextStyle,
  type WordmarkVariant,
} from "./layout";

export interface CvDropPosterInput {
  /** The CV drop link the QR opens (the same one the page shows and copies). */
  url: string;
  companyName: string;
  /** Company logo, already a PNG from /employer/cv-drop/logo. null → no-logo poster. */
  logo: Blob | null;
}

type Ctx = CanvasRenderingContext2D;
type Align = "left" | "center" | "right";

const ICON_URLS: Record<FeatureIcon, string> = {
  upload: iconUploadUrl,
  noticed: iconNoticedUrl,
  team: iconTeamUrl,
};

/** Canvas letter spacing (Chrome 99+, Safari 17.4+, Firefox 115+); otherwise glyph by glyph. */
const NATIVE_LETTER_SPACING =
  typeof CanvasRenderingContext2D !== "undefined" &&
  "letterSpacing" in CanvasRenderingContext2D.prototype;

function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  return img.decode().then(() => img);
}

async function decodeLogo(logo: Blob | null): Promise<ImageBitmap | null> {
  if (!logo) return null;
  try {
    return await createImageBitmap(logo);
  } catch {
    return null; // unreadable logo → the no-logo poster, never a broken image
  }
}

function setFont(ctx: Ctx, style: Pick<TextStyle, "family" | "weight" | "size">) {
  ctx.font = `${style.weight} ${style.size}px "${style.family}"`;
}

function setLetterSpacing(ctx: Ctx, px: number) {
  if (NATIVE_LETTER_SPACING) ctx.letterSpacing = `${px}px`;
}

/** Advance width with `spacing` between characters (none after the last). Font must be set. */
function measureSpaced(ctx: Ctx, text: string, spacing: number): number {
  setLetterSpacing(ctx, 0);
  const chars = Array.from(text).length;
  return ctx.measureText(text).width + spacing * Math.max(0, chars - 1);
}

/** Draws one line of text and returns its left and right edges (design units). */
function drawText(ctx: Ctx, text: string, x: number, baseline: number, style: TextStyle, align: Align) {
  setFont(ctx, style);
  ctx.fillStyle = style.color;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const width = measureSpaced(ctx, text, style.letterSpacing);
  const left = align === "center" ? x - width / 2 : align === "right" ? x - width : x;

  if (NATIVE_LETTER_SPACING) {
    setLetterSpacing(ctx, style.letterSpacing);
    ctx.fillText(text, left, baseline);
    setLetterSpacing(ctx, 0);
  } else {
    let cursor = left;
    for (const ch of Array.from(text)) {
      ctx.fillText(ch, cursor, baseline);
      cursor += ctx.measureText(ch).width + style.letterSpacing;
    }
  }
  return { left, right: left + width };
}

function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --- company name -------------------------------------------------------------

function wordmarkStyle(size: number): TextStyle {
  return {
    family: WORDMARK.family,
    weight: WORDMARK.weight,
    size,
    letterSpacing: size * WORDMARK.letterSpacingPerPx,
    color: WORDMARK.color,
  };
}

function wordmarkWidth(ctx: Ctx, text: string, size: number): number {
  const style = wordmarkStyle(size);
  setFont(ctx, style);
  return measureSpaced(ctx, text, style.letterSpacing);
}

/** Trims `text` and adds "…" until it fits. */
function ellipsize(text: string, fits: (t: string) => boolean): string {
  if (fits(text)) return text;
  let chars = Array.from(text);
  while (chars.length > 1 && !fits(`${chars.join("").trimEnd()}…`)) chars = chars.slice(0, -1);
  return `${chars.join("").trimEnd()}…`;
}

/** Splits at the space closest to the middle, or null when there is no space. */
function splitNearMiddle(text: string): [string, string] | null {
  const middle = text.length / 2;
  let best = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === " " && (best < 0 || Math.abs(i - middle) < Math.abs(best - middle))) best = i;
  }
  if (best < 0) return null;
  return [text.slice(0, best).trim(), text.slice(best + 1).trim()];
}

/** Shrink to fit, then two lines at the minimum size, then "…" (locked decisions). */
export function layoutWordmark(
  ctx: Ctx,
  companyName: string,
  variant: WordmarkVariant,
): { size: number; lines: { text: string; baseline: number }[] } {
  const text = companyName.trim().toUpperCase();
  for (let size = variant.size; size >= variant.minSize; size -= WORDMARK.shrinkStep) {
    if (wordmarkWidth(ctx, text, size) <= variant.maxWidth) {
      return { size, lines: [{ text, baseline: variant.baseline }] };
    }
  }

  const size = variant.minSize;
  const fits = (t: string) => wordmarkWidth(ctx, t, size) <= variant.maxWidth;
  const split = splitNearMiddle(text);
  if (!split) return { size, lines: [{ text: ellipsize(text, fits), baseline: variant.baseline }] };

  // Balanced split when both halves fit; otherwise fill line 1 with whole words
  // so only line 2 is cut.
  const [first, second] = fits(split[0]) && fits(split[1]) ? split : fillFirstLine(text, fits);
  return {
    size,
    lines: [
      { text: ellipsize(first, fits), baseline: variant.twoLineBaselines[0] },
      { text: ellipsize(second, fits), baseline: variant.twoLineBaselines[1] },
    ],
  };
}

/** As many whole words as fit on line 1 (at least one), the rest on line 2. */
function fillFirstLine(text: string, fits: (t: string) => boolean): [string, string] {
  const words = text.split(/\s+/).filter(Boolean);
  let count = 1;
  while (count < words.length - 1 && fits(words.slice(0, count + 1).join(" "))) count++;
  return [words.slice(0, count).join(" "), words.slice(count).join(" ")];
}

// --- layers --------------------------------------------------------------------

function drawLogo(ctx: Ctx, logo: ImageBitmap) {
  const scale = Math.min(LOGO_BOX.width / logo.width, LOGO_BOX.height / logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(logo, LOGO_BOX.x + (LOGO_BOX.width - w) / 2, LOGO_BOX.y + (LOGO_BOX.height - h) / 2, w, h);
}

function drawWordmark(ctx: Ctx, companyName: string, hasLogo: boolean) {
  const { size, lines } = layoutWordmark(ctx, companyName, hasLogo ? WORDMARK_WITH_LOGO : WORDMARK_NO_LOGO);
  for (const line of lines) {
    drawText(ctx, line.text, WORDMARK.centerX, line.baseline, wordmarkStyle(size), "center");
  }
}

/** Whole-pixel modules in device pixels so the printed code stays crisp. */
function drawQr(ctx: Ctx, url: string) {
  const { modules } = QRCode.create(url, { errorCorrectionLevel: QR_CODE.errorCorrectionLevel });
  const total = modules.size + QR_CODE.marginModules * 2;
  const boxPx = QR_CODE.size * EXPORT_SCALE;
  const modulePx = Math.floor(boxPx / total);
  const inset = Math.floor((boxPx - modulePx * total) / 2) + QR_CODE.marginModules * modulePx;
  const originX = QR_CODE.x * EXPORT_SCALE;
  const originY = QR_CODE.y * EXPORT_SCALE;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = COLORS.qrLight;
  ctx.fillRect(originX, originY, boxPx, boxPx);
  ctx.fillStyle = COLORS.qrDark;
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) {
        ctx.fillRect(originX + inset + col * modulePx, originY + inset + row * modulePx, modulePx, modulePx);
      }
    }
  }
  ctx.restore();
}

function drawFeatures(ctx: Ctx, icons: Record<FeatureIcon, HTMLImageElement>) {
  for (const feature of FEATURES) {
    ctx.beginPath();
    ctx.arc(feature.cx, FEATURE_CIRCLE.cy, FEATURE_CIRCLE.r, 0, Math.PI * 2);
    ctx.fillStyle = FEATURE_CIRCLE.color;
    ctx.fill();
    const half = FEATURE_ICON_SIZE / 2;
    ctx.drawImage(icons[feature.icon], feature.cx - half, FEATURE_CIRCLE.cy - half, FEATURE_ICON_SIZE, FEATURE_ICON_SIZE);
    feature.lines.forEach((line, i) => {
      drawText(ctx, line, feature.cx, FEATURE_LABEL.baselines[i], FEATURE_LABEL.style, "center");
    });
  }
  ctx.strokeStyle = FEATURE_DIVIDERS.color;
  ctx.lineWidth = FEATURE_DIVIDERS.width;
  for (const line of FEATURE_DIVIDERS.lines) {
    ctx.beginPath();
    ctx.moveTo(line.x, line.y1);
    ctx.lineTo(line.x, line.y2);
    ctx.stroke();
  }
}

function drawFooter(ctx: Ctx) {
  roundRectPath(ctx, FOOTER_BAR.x, FOOTER_BAR.y, FOOTER_BAR.width, FOOTER_BAR.height, FOOTER_BAR.radius);
  ctx.fillStyle = FOOTER_BAR.color;
  ctx.fill();

  drawText(ctx, POWERED_BY.text, POWERED_BY.x, POWERED_BY.y, POWERED_BY.style, "right");

  ctx.strokeStyle = FOOTER_DIVIDER.color;
  ctx.lineWidth = FOOTER_DIVIDER.width;
  ctx.beginPath();
  ctx.moveTo(FOOTER_DIVIDER.x, FOOTER_DIVIDER.y1);
  ctx.lineTo(FOOTER_DIVIDER.x, FOOTER_DIVIDER.y2);
  ctx.stroke();

  // FitMyJob logo, drawn (an SVG image cannot use Poppins; logo.png is too small for print).
  const { x, y, card, fitMy, job } = FITMYJOB_LOGO;
  roundRectPath(ctx, x + card.dx, y + card.dy, card.width, card.height, card.radius);
  ctx.fillStyle = card.fill;
  ctx.fill();
  ctx.strokeStyle = card.stroke;
  ctx.lineWidth = card.strokeWidth;
  ctx.stroke();
  const small: TextStyle = { family: FONT_HEADLINE, weight: 800, size: fitMy.size, letterSpacing: 0, color: COLORS.white };
  const fit = drawText(ctx, "FIT", x + fitMy.dx, y + fitMy.baselineDy, small, "left");
  drawText(ctx, "MY", fit.right, y + fitMy.baselineDy, { ...small, color: COLORS.yellow }, "left");
  drawText(
    ctx,
    "JOB",
    x + job.centerDx,
    y + job.baselineDy,
    { ...small, size: job.size, color: COLORS.yellow },
    "center",
  );
}

function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the poster"))), "image/png");
  });
}

/** Renders the CV drop poster as a 2048 × 3072 PNG. */
export async function renderCvDropPoster({ url, companyName, logo }: CvDropPosterInput): Promise<Blob> {
  const [, background, accent, frame, upload, noticed, team, logoBitmap] = await Promise.all([
    loadPosterFonts(),
    loadImage(backgroundUrl),
    loadImage(accentLinesUrl),
    loadImage(qrFrameUrl),
    loadImage(ICON_URLS.upload),
    loadImage(ICON_URLS.noticed),
    loadImage(ICON_URLS.team),
    decodeLogo(logo),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = DESIGN_WIDTH * EXPORT_SCALE;
  canvas.height = DESIGN_HEIGHT * EXPORT_SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);

  try {
    ctx.drawImage(background, 0, 0, DESIGN_WIDTH, DESIGN_HEIGHT);

    if (logoBitmap) drawLogo(ctx, logoBitmap);
    drawWordmark(ctx, companyName, !!logoBitmap);

    drawText(ctx, HEADLINE_LINE_1.text, HEADLINE_LINE_1.x, HEADLINE_LINE_1.y, HEADLINE_LINE_1.style, "center");
    const job = drawText(ctx, HEADLINE_LINE_2.text, HEADLINE_LINE_2.x, HEADLINE_LINE_2.y, HEADLINE_LINE_2.style, "center");
    const accentX = Math.min(job.right + ACCENT_LINES.gapAfterJob, ACCENT_LINES.maxRight - ACCENT_LINES.width);
    ctx.drawImage(accent, accentX, ACCENT_LINES.top, ACCENT_LINES.width, ACCENT_LINES.height);
    drawText(ctx, SUB_HEADLINE.text, SUB_HEADLINE.x, SUB_HEADLINE.y, SUB_HEADLINE.style, "center");

    ctx.drawImage(frame, QR_FRAME.x, QR_FRAME.y, QR_FRAME.width, QR_FRAME.height);
    drawQr(ctx, url);

    drawFeatures(ctx, { upload, noticed, team });
    drawFooter(ctx);
  } finally {
    logoBitmap?.close();
  }

  return canvasToPng(canvas);
}

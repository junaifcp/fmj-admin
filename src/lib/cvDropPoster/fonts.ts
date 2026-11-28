// Copied unchanged from employer-frontend/src/lib/cvDropPoster/fonts.ts so admin's
// "Download CV drop" (Hiring → Companies) prints the exact poster the employer
// gets. Change both copies together.
// Employer CV drop poster 3.1 — the poster's fonts, loaded only when a poster
// is rendered. Not part of global CSS; the app font stays Inter.
import poppinsBoldUrl from "@/assets/fonts/cv-drop-poster/Poppins-Bold-latin.woff2?url";
import poppinsExtraBoldUrl from "@/assets/fonts/cv-drop-poster/Poppins-ExtraBold-latin.woff2?url";
import cinzelRegularUrl from "@/assets/fonts/cv-drop-poster/Cinzel-Regular-latin.woff2?url";
import { FONT_HEADLINE, FONT_SERIF } from "./layout";

const FACES = [
  { family: FONT_HEADLINE, weight: "700", url: poppinsBoldUrl },
  { family: FONT_HEADLINE, weight: "800", url: poppinsExtraBoldUrl },
  { family: FONT_SERIF, weight: "400", url: cinzelRegularUrl },
];

let loading: Promise<void> | null = null;

/** Loads all three faces once. Rejects if any fails; never draw with a fallback font. */
export function loadPosterFonts(): Promise<void> {
  if (!loading) {
    loading = Promise.all(
      FACES.map(async ({ family, weight, url }) => {
        const face = new FontFace(family, `url(${url}) format("woff2")`, { weight, style: "normal" });
        await face.load();
        document.fonts.add(face);
      }),
    )
      .then(() => undefined)
      .catch((err) => {
        loading = null; // allow a retry on the next click
        throw err;
      });
  }
  return loading;
}

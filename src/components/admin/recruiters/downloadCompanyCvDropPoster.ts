// Admin Companies "Download CV drop": renders the company's CV drop print
// poster (the same poster the employer downloads from their CV drop page) and
// saves it as a PNG. The renderer, fonts and assets load only on this click.
// Download steps follow employer-frontend/src/pages/recruiter/CvDrop.tsx.
import { companyAdminApi } from "@/api/companyAdmin";
import type { CompanyCvDrop } from "@/types/recruiterAdmin";

/** "Acme Foods Pvt. Ltd." → "acme-foods-pvt-ltd" (file names only). */
export function companyFileSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || "company";
}

/** Resolves with the CV drop it printed (for the toast); rejects on any failure. */
export async function downloadCompanyCvDropPoster(companyId: string): Promise<CompanyCvDrop> {
  const drop = await companyAdminApi.getCvDrop(companyId);
  const [{ renderCvDropPoster }, logo] = await Promise.all([
    import("@/lib/cvDropPoster/render"),
    // A missing or broken logo never stops the download: no-logo poster instead.
    drop.hasLogo ? companyAdminApi.getCvDropLogoBlob(companyId).catch(() => null) : Promise.resolve(null),
  ]);
  const blob = await renderCvDropPoster({ url: drop.publicUrl, companyName: drop.companyName, logo });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = `cv-drop-poster-${companyFileSlug(drop.companyName)}-${drop.code}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke after the browser has started the save (Safari needs a moment).
  setTimeout(() => URL.revokeObjectURL(href), 1000);
  return drop;
}

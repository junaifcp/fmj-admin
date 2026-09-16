// utils/exportImage.ts
import domtoimage from "dom-to-image-more";
import { saveAs } from "file-saver";

/**
 * Convert Blob -> base64 DataURL
 */
async function blobToDataURL(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = reject;
    r.onload = () => resolve(String(r.result));
    r.readAsDataURL(blob);
  });
}

/**
 * Inline external <img> resources under `root` by fetching them and replacing `src`
 * with a data: URL. This avoids many CORS/export problems for <img> tags.
 */
async function inlineExternalImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:") || src.startsWith("blob:")) return;

      try {
        const resp = await fetch(src, { mode: "cors", cache: "force-cache" });
        if (!resp.ok) throw new Error("image fetch failed");
        const blob = await resp.blob();
        const dataUrl = await blobToDataURL(blob);
        try {
          img.setAttribute("crossorigin", "anonymous");
        } catch {}
        img.setAttribute("src", dataUrl);
      } catch (err) {
        // swallow — we'll still try exporting; sometimes fetch fails due to CORS
        // but many images will succeed
        // console.warn("inline image failed for", src, err);
      }
    })
  );
}

/**
 * Copy computed styles from source element to target element.
 * Safely iterates all computed style properties.
 */
function copyComputedStyle(from: Element, to: HTMLElement) {
  const computed: CSSStyleDeclaration = window.getComputedStyle(from);
  let cssText = "";

  for (let i = 0; i < computed.length; i++) {
    const prop = computed.item(i);
    try {
      const val = computed.getPropertyValue(prop);
      if (!val) continue;
      // Skip animations and transitions to avoid artifacts
      if (
        prop === "transition" ||
        prop.startsWith("animation") ||
        prop.startsWith("scroll") ||
        prop.startsWith("caret") ||
        prop.startsWith("cursor")
      )
        continue;
      cssText += `${prop}: ${val}; `;
    } catch {
      // Some props throw security errors — ignore
    }
  }

  // Apply combined inline styles
  (to.style as CSSStyleDeclaration).cssText += cssText;
}

/**
 * Walk both trees in parallel and copy computed styles.
 */
function copyAllComputedStyles(
  sourceRoot: HTMLElement,
  cloneRoot: HTMLElement
) {
  const sourceElems = [
    sourceRoot,
    ...Array.from(sourceRoot.querySelectorAll("*")),
  ];
  const cloneElems = [
    cloneRoot,
    ...Array.from(cloneRoot.querySelectorAll("*")),
  ];

  const count = Math.min(sourceElems.length, cloneElems.length);
  for (let i = 0; i < count; i++) {
    const source = sourceElems[i];
    const target = cloneElems[i] as HTMLElement;
    if (!source || !target) continue;
    copyComputedStyle(source, target);
  }
}

/**
 * Attempt to extract readable stylesheet content and inject into the clone wrapper.
 * Some stylesheets are not readable due to cross-origin restrictions — those are skipped.
 */
function collectReadableStyles(): string {
  let css = "";

  for (const sheet of Array.from(document.styleSheets)) {
    try {
      const rules = sheet.cssRules;
      if (!rules) continue;

      // rules is a CSSRuleList; iterate and read cssText when available
      for (let i = 0; i < rules.length; i++) {
        const rule = rules.item(i);
        if (!rule) continue;

        // rule.cssText exists on CSSRule, but TS sometimes needs an assertion
        // Use a safe guard and append only when present
        const cssText = (rule as CSSRule & { cssText?: string }).cssText;
        if (cssText) css += cssText + "\n";
      }
    } catch (err) {
      // Accessing cssRules can throw for cross-origin stylesheets — ignore these
      continue;
    }
  }

  return css;
}

/**
 * Export a DOM node as a PNG file.
 * - node: the HTMLElement to capture
 * - filename: downloaded filename
 * - width/height: target pixel dimensions (default to Instagram square 1080x1080)
 */
export async function exportNodeAsImage(
  node: HTMLElement,
  filename: string,
  width = 1080,
  height = 1080
): Promise<void> {
  if (!node) throw new Error("No node supplied for export");

  // Wait for fonts to be ready (important for stable layout)
  try {
    if (document && (document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }
  } catch {
    // ignore
  }

  // Use bounding rect for layout size
  const rect = node.getBoundingClientRect();
  const nodeWidth = Math.max(rect.width, node.offsetWidth || 0) || 1;
  const nodeHeight = Math.max(rect.height, node.offsetHeight || 0) || 1;

  // We'll scale so the content fills the target size (cover behavior). This avoids tiny inset renders.
  const scaleX = width / nodeWidth;
  const scaleY = height / nodeHeight;
  const scale = Math.max(scaleX, scaleY);

  // Clone the node to avoid mutating the live page
  const clone = node.cloneNode(true) as HTMLElement;

  // Inline images in the clone (best effort)
  try {
    await inlineExternalImages(clone);
  } catch {
    // ignore
  }

  // Force explicit size on clone so layout is stable
  clone.style.boxSizing = "border-box";
  clone.style.width = `${nodeWidth}px`;
  clone.style.height = `${nodeHeight}px`;
  clone.style.margin = "0";
  clone.style.transformOrigin = "top left";
  // apply scale visually (we will render wrapper at scaled pixel size)
  clone.style.transform = `scale(${scale})`;

  // copy computed styles from source to clone
  try {
    copyAllComputedStyles(node as HTMLElement, clone);
  } catch (err) {
    // still proceed even if copying styles partially fails
    // console.warn("copyAllComputedStyles failed", err);
  }

  // Create wrapper positioned offscreen to avoid layout shift
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.left = "-99999px";
  wrapper.style.top = "0";
  wrapper.style.width = `${Math.round(nodeWidth * scale)}px`;
  wrapper.style.height = `${Math.round(nodeHeight * scale)}px`;
  wrapper.style.overflow = "hidden";
  wrapper.style.background = "transparent";
  wrapper.style.zIndex = "-99999";

  // inject readable stylesheet rules (best effort) so classes + pseudo elements apply
  const collected = collectReadableStyles();
  if (collected) {
    const styleTag = document.createElement("style");
    styleTag.innerHTML = collected;
    wrapper.appendChild(styleTag);
  }

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  const targetWidth = Math.round(nodeWidth * scale);
  const targetHeight = Math.round(nodeHeight * scale);

  // dom-to-image-more options
  const opts: any = {
    width: targetWidth,
    height: targetHeight,
    quality: 1,
    cacheBust: true,
    style: {
      transform: "scale(1)",
      transformOrigin: "top left",
      background: "transparent",
    },
  };

  // Try render (with one retry fallback)
  try {
    const blob: Blob = await domtoimage.toBlob(wrapper, opts);
    saveAs(blob, filename);
  } catch (err) {
    // second attempt without cacheBust and with simpler options
    try {
      const blob: Blob = await domtoimage.toBlob(wrapper, {
        width: targetWidth,
        height: targetHeight,
        quality: 1,
      });
      saveAs(blob, filename);
    } catch (err2) {
      console.error("exportNodeAsImage: both attempts failed", err, err2);
      throw new Error("Failed to generate poster image. Please try again.");
    }
  } finally {
    // cleanup
    try {
      if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
    } catch {}
  }
}

/**
 * Download detailed job payload as JSON.
 * Keeps backward compatibility with the simple job object you pass from JobCard,
 * but will include extra fields when present (company object, location, metadata, etc.).
 */
export function downloadJobDetails(job: {
  title: string;
  companyName?: string;
  description: string;
  summary: string;
  requirements: string[];
  qualifications: string[];
  salary: { min?: number; max?: number; currency?: string };
  type: string;
  // allow additional optional properties that may exist on your Job object:
  company?: any;
  companyId?: any;
  location?: any;
  companyLocation?: any;
  applicationCount?: number;
  createdAt?: string;
  updatedAt?: string;
  postedBy?: string;
  ageMin?: number;
  ageMax?: number;
  genderPreference?: string;
  useCompanyLocation?: boolean;
  otherAllowances?: string[];
  [k: string]: any;
}): void {
  // sanitize title for filename
  const sanitizedTitle = job.title
    ? job.title
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase()
    : "job";

  // Normalize company object if available
  const companyObj =
    job.company ??
    (job.companyId && typeof job.companyId === "object" ? job.companyId : null);

  const company = {
    name: job.companyName || (companyObj && companyObj.name) || null,
    logoUrl: (companyObj && companyObj.logo) || null,
    website: (companyObj && companyObj.website) || null,
    raw: companyObj ?? null,
  };

  // Normalize location information
  const location =
    job.location ||
    job.companyLocation ||
    (companyObj && companyObj.location) ||
    null;

  // Salary formatting helper
  const salaryMin = job.salary?.min ?? null;
  const salaryMax = job.salary?.max ?? null;
  const currency = job.salary?.currency ?? "USD";

  const salaryFormatted =
    salaryMin && salaryMax
      ? `${currency} ${Number(salaryMin).toLocaleString()} - ${Number(
          salaryMax
        ).toLocaleString()}`
      : salaryMin
      ? `${currency} ${Number(salaryMin).toLocaleString()}`
      : salaryMax
      ? `${currency} ${Number(salaryMax).toLocaleString()}`
      : "Not specified";

  // Derived/auxiliary fields
  const primaryQualifications = Array.isArray(job.qualifications)
    ? job.qualifications.slice(0, 5)
    : [];
  const topRequirements = Array.isArray(job.requirements)
    ? job.requirements.slice(0, 10)
    : [];

  const tags = [
    job.type,
    job.genderPreference,
    company?.name,
    ...(primaryQualifications || []).slice(0, 3),
    ...(topRequirements || []).slice(0, 3),
  ]
    .filter(Boolean)
    .map(String);

  // metadata
  const exportedAt = new Date().toISOString();
  const exporterVersion = "fitmyjob-web-1.0";

  // Build payload (rich but compact)
  const payload = {
    exportedAt,
    exporterVersion,
    job: {
      id: job._id ?? null,
      title: job.title ?? null,
      summary: job.summary ?? null,
      description: job.description ?? null,
      type: job.type ?? null,
      experienceYears: job.experienceYears ?? null,
      requirements: topRequirements,
      qualifications: primaryQualifications,
      skills: job.skills ?? job.skillIds ?? null,
      salary: {
        min: salaryMin,
        max: salaryMax,
        currency,
        formatted: salaryFormatted,
      },
      location: location ?? null,
      company,
      meta: {
        postedBy: job.postedBy ?? null,
        createdAt: job.createdAt ?? null,
        updatedAt: job.updatedAt ?? null,
        applicationCount: job.applicationCount ?? 0,
        useCompanyLocation: job.useCompanyLocation ?? false,
        genderPreference: job.genderPreference ?? null,
        ageMin: job.ageMin ?? null,
        ageMax: job.ageMax ?? null,
        otherAllowances: job.otherAllowances ?? null,
      },
      tags,
      // include raw job object so server-side generators have full context if needed
      raw: job,
    },
  };

  // Create blob and trigger download
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });

  saveAs(blob, `job-details-${sanitizedTitle}.json`);
}

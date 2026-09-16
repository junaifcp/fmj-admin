import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface JobPdfData {
  _id?: string;
  title: string;
  summary?: string;
  description: string;
  type: string;
  experienceYears?: number;
  requirements?: string[];
  qualifications?: string[];
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  company?: {
    name?: string;
    logo?: string;
    website?: string;
    location?: any;
  };
  companyName?: string;
  location?: any;
  skills?: any[];
  applicationCount?: number;
  createdAt?: string;
  genderPreference?: string;
  ageMin?: number;
  ageMax?: number;
  otherAllowances?: string[];
  [key: string]: any;
}

const createJobPdfContent = (job: JobPdfData): HTMLElement => {
  const container = document.createElement("div");
  container.style.cssText = `
    width: 210mm;
    padding: 20mm;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  `;

  const companyName = job.companyName || job.company?.name || "Company";
  const salaryText = formatSalary(job.salary);
  const locationText = formatLocation(job.location || job.company?.location);
  const dateText = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  container.innerHTML = `
    <div style="margin-bottom: 32px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
        <div style="flex: 1;">
          <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700; color: #0f172a; line-height: 1.2;">
            ${escapeHtml(job.title)}
          </h1>
          <div style="font-size: 18px; color: #475569; font-weight: 500;">
            ${escapeHtml(companyName)}
          </div>
        </div>
        ${
          job.company?.logo
            ? `
          <img src="${job.company.logo}" 
               style="width: 64px; height: 64px; object-fit: contain; border-radius: 8px; border: 1px solid #e2e8f0;" 
               crossorigin="anonymous" />
        `
            : ""
        }
      </div>
      
      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px;">
        <span style="display: inline-block; padding: 6px 16px; color: #1e40af; border-radius: 9999px; font-size: 13px; font-weight: 600;">
          ${escapeHtml(job.type.replace("-", " ").toUpperCase())}
        </span>
        ${
          job.experienceYears
            ? `
          <span style="display: inline-block; padding: 6px 16px; color: #475569; border-radius: 9999px; font-size: 13px; font-weight: 500;">
            ${job.experienceYears}+ Years Experience
          </span>
        `
            : ""
        }
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <div>
        <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          Location
        </div>
        <div style="font-size: 15px; color: #1e293b; font-weight: 500;">
          ${escapeHtml(locationText)}
        </div>
      </div>
      
      <div>
        <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
          Salary Range
        </div>
        <div style="font-size: 15px; color: #1e293b; font-weight: 500;">
          ${escapeHtml(salaryText)}
        </div>
      </div>
      
      ${
        job.applicationCount !== undefined
          ? `
        <div>
          <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            Applications
          </div>
          <div style="font-size: 15px; color: #1e293b; font-weight: 500;">
            ${job.applicationCount} Applicants
          </div>
        </div>
      `
          : ""
      }
      
      ${
        dateText
          ? `
        <div>
          <div style="font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            Posted Date
          </div>
          <div style="font-size: 15px; color: #1e293b; font-weight: 500;">
            ${escapeHtml(dateText)}
          </div>
        </div>
      `
          : ""
      }
    </div>

    ${
      job.summary
        ? `
      <div style="margin-bottom: 28px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          Summary
        </h2>
        <p style="margin: 0; font-size: 15px; color: #334155; line-height: 1.7;">
          ${escapeHtml(job.summary)}
        </p>
      </div>
    `
        : ""
    }

    <div style="margin-bottom: 28px;">
      <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
        Job Description
      </h2>
      <div style="font-size: 14px; color: #334155; line-height: 1.8;">
        ${formatDescription(job.description)}
      </div>
    </div>

    ${
      job.requirements && job.requirements.length > 0
        ? `
      <div style="margin-bottom: 28px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          Requirements
        </h2>
        <ul style="margin: 0; padding-left: 24px; font-size: 14px; color: #334155;">
          ${job.requirements
            .map(
              (req) => `
            <li style="margin-bottom: 8px; line-height: 1.6;">
              ${escapeHtml(req)}
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `
        : ""
    }

    ${
      job.qualifications && job.qualifications.length > 0
        ? `
      <div style="margin-bottom: 28px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          Qualifications
        </h2>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${job.qualifications
            .map(
              (qual) => `
            <span style="display: inline-block; padding: 8px 16px; background: #f1f5f9; color: #475569; border-radius: 8px; font-size: 13px; font-weight: 500; border: 1px solid #e2e8f0;">
              ${escapeHtml(qual)}
            </span>
          `
            )
            .join("")}
        </div>
      </div>
    `
        : ""
    }

    ${
      job.genderPreference ||
      job.ageMin ||
      job.ageMax ||
      (job.otherAllowances && job.otherAllowances.length > 0)
        ? `
      <div style="margin-bottom: 28px;">
        <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">
          Additional Information
        </h2>
        <div style="font-size: 14px; color: #334155; line-height: 1.8;">
          ${
            job.genderPreference
              ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 600; color: #1e293b;">Gender Preference:</span> ${escapeHtml(
                job.genderPreference
              )}
            </div>
          `
              : ""
          }
          ${
            job.ageMin || job.ageMax
              ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 600; color: #1e293b;">Age Range:</span> 
              ${job.ageMin || "Any"} - ${job.ageMax || "Any"} years
            </div>
          `
              : ""
          }
          ${
            job.otherAllowances && job.otherAllowances.length > 0
              ? `
            <div style="margin-bottom: 8px;">
              <span style="font-weight: 600; color: #1e293b;">Benefits & Allowances:</span>
              <ul style="margin: 4px 0 0 0; padding-left: 24px;">
                ${job.otherAllowances
                  .map((allow) => `<li>${escapeHtml(allow)}</li>`)
                  .join("")}
              </ul>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `
        : ""
    }

    ${
      job.company?.website
        ? `
      <div style="margin-top: 32px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center;">
        <div style="font-size: 13px; color: #64748b; margin-bottom: 6px;">
          Learn more about us
        </div>
        <a href="${job.company.website}" 
           style="font-size: 14px; color: #3b82f6; font-weight: 600; text-decoration: none;">
          ${escapeHtml(job.company.website)}
        </a>
      </div>
    `
        : ""
    }

    <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
      Generated on ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })} • Job ID: ${job._id || "N/A"}
    </div>
  `;

  return container;
};

const formatSalary = (salary?: {
  min?: number;
  max?: number;
  currency?: string;
}): string => {
  if (!salary || (!salary.min && !salary.max)) return "Competitive salary";

  const currency = salary.currency || "USD";
  const format = (num: number) => num.toLocaleString();

  if (salary.min && salary.max) {
    return `${currency} ${format(salary.min)} - ${format(salary.max)}`;
  }

  return salary.min
    ? `${currency} ${format(salary.min)}+`
    : `Up to ${currency} ${format(salary.max!)}`;
};

const formatLocation = (location: any): string => {
  if (!location) return "Location not specified";

  if (typeof location === "string") return location;

  return location.formattedAddress || (location.city && location.country)
    ? `${location.city}, ${location.country}`
    : location.city || location.country || "Location not specified";
};

const formatDescription = (description: string): string => {
  if (!description) return "";

  // Convert line breaks to paragraphs
  const paragraphs = description.split("\n").filter((p) => p.trim());

  return paragraphs
    .map((p) => `<p style="margin: 0 0 12px 0;">${escapeHtml(p)}</p>`)
    .join("");
};

const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

export const downloadJobDetailsPdf = async (job: JobPdfData): Promise<void> => {
  try {
    toast.loading("Generating PDF...", { id: "pdf-gen" });

    // Wait for fonts
    if (document && (document as any).fonts && (document as any).fonts.ready) {
      await (document as any).fonts.ready;
    }

    // Create styled content
    const contentElement = createJobPdfContent(job);

    // Append offscreen
    contentElement.style.position = "fixed";
    contentElement.style.left = "-99999px";
    contentElement.style.top = "0";
    contentElement.style.zIndex = "-9999";
    document.body.appendChild(contentElement);

    // Small delay to ensure rendering
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Capture as canvas
    const canvas = await html2canvas(contentElement, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Remove from DOM
    document.body.removeChild(contentElement);

    // Create PDF
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Download
    const sanitizedTitle = (job.title || "job-details")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();

    pdf.save(`${sanitizedTitle}-details.pdf`);

    toast.success("PDF downloaded successfully!", { id: "pdf-gen" });
  } catch (error) {
    console.error("PDF generation failed:", error);
    toast.error("Failed to generate PDF. Please try again.", { id: "pdf-gen" });
    throw error;
  }
};

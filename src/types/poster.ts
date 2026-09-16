export type TemplateId = "A" | "B" | "C" | "D";

export interface PosterData {
  title: string;
  qualifications: string[];
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  backgroundImage?: string;
  website?: string;
  location?: string;
}

export interface PosterTemplate {
  id: TemplateId;
  name: string;
  description: string;
}

export const posterTemplates: PosterTemplate[] = [
  {
    id: "A",
    name: "Clean Corporate",
    description: "Professional white background with company branding",
  },
  {
    id: "B",
    name: "Bold Gradient",
    description: "Eye-catching gradient with centered text",
  },
  {
    id: "C",
    name: "Minimal Card",
    description: "Clean card layout with key requirements",
  },
  {
    id: "D",
    name: "Modern Poster",
    description: "Contemporary design with call-to-action",
  },
];

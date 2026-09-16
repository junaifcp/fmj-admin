// src/constants/educationOptions.ts
// Education levels matching CandidateEducation model EducationLevel enum
export type EducationLevel =
  | "high-school"
  | "associate"
  | "bachelor"
  | "master"
  | "phd"
  | "certificate"
  | "other";

export type EducationOption = {
  label: string;
  value: EducationLevel;
  description?: string; // human-friendly subtext shown in dropdown
};

export const educationOptions: EducationOption[] = [
  {
    label: "High School",
    value: "high-school",
    description: "High school diploma or equivalent",
  },
  {
    label: "Associate Degree",
    value: "associate",
    description: "Associate degree or 2-year college",
  },
  {
    label: "Bachelor's Degree",
    value: "bachelor",
    description: "Bachelor's degree (4-year college)",
  },
  {
    label: "Master's Degree",
    value: "master",
    description: "Master's degree (MA / MSc / MBA)",
  },
  {
    label: "PhD / Doctorate",
    value: "phd",
    description: "PhD or Doctorate",
  },
  {
    label: "Certificate",
    value: "certificate",
    description: "Professional certificate or short course",
  },
  {
    label: "Other",
    value: "other",
    description: "Other education not listed above",
  },
];

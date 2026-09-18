import { z } from "zod";

// A helper for optional strings that can be empty
const optionalString = z.string().optional();

// Define schemas for nested objects first
const experienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
});

const educationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  url: optionalString,
  urlLink: optionalString,
  description: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
});

const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Skill name is required"),
  proficiency: z.number().min(0).max(100),
});

const certificationSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Certification name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Date is required"),
});

const languageSchema = z.object({
  id: z.string(),
  language: z.string().min(1, "Language is required"),
  proficiency: z.string().min(1, "Proficiency is required"),
});

// Main resume schema for the frontend
export const resumeValidationSchema = z.object({
  name: z
    .string()
    .min(1, "Resume name is required")
    .max(100, "Name must be 100 characters or less"),
  title: optionalString,
  // Improved validation for specific fields
  email: z
    .string()
    .email({ message: "Please enter a valid email" })
    .optional()
    .or(z.literal("")),
  phone: optionalString,
  location: optionalString,
  website: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  summary: optionalString,
  themeColor: optionalString,
  headerColor: optionalString,
  templateId: z.enum([
    "template-a",
    "template-b",
    "template-c",
    "template-d",
    "template-e",
    "template-f",
    "template-g",
    "template-h",
    "template-i",
    "template-j",
    "template-k",
    "template-l",
  ]),
  headerAlignment: z.enum(["left", "center", "right"]).optional(),
  profileImage: optionalString,
  declaration: optionalString,
  experiences: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  projects: z.array(projectSchema).optional(),
  skills: z.array(skillSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  languages: z.array(languageSchema).optional(),
  yearsExperience: z.number().min(0).max(80).optional(),
});

// We can also infer the TypeScript type from the schema
export type ResumeFormData = z.infer<typeof resumeValidationSchema>;

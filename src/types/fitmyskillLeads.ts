// src/types/fitmyskillLeads.ts

export type LeadStatus = "new" | "contacted" | "enrolled" | "not_interested";

export interface PlaceLabel {
  city?: string;
  country?: string;
}

export interface LeadRow {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  dialCode?: string;
  currentLocation?: PlaceLabel;
  dreamJobs: { title?: string; locations: PlaceLabel[] }[];
  skills: string[];
  education: { level?: string; stream?: string } | null;
  experienceYears: number | null;
  lastActive?: string;
  signupAt?: string;
  leadStatus?: LeadStatus;
  courseKey?: string | null;
  assignedTo?: { id: string; name: string } | null;
}

export type CourseKey = "excel" | "payroll" | "claude-ai" | "uae-labour-law";

export interface Assignee {
  id: string;
  name: string;
  email?: string;
}

export interface LeadDetail extends Omit<LeadRow, "skills" | "education"> {
  notes: string | null;
  lastContactedAt: string | null;
  workStatus: string | null;
  skills: { name: string; level: string }[];
  education: {
    institutionName?: string;
    level?: string;
    stream?: string;
    startDate?: string;
    endDate?: string;
    isPresent?: boolean;
  }[];
  experience: {
    companyName?: string;
    roleName?: string;
    startDate?: string;
    endDate?: string;
    isPresent?: boolean;
  }[];
}

// null clears courseKey and assignedTo; an empty string clears notes.
export interface LeadPatchBody {
  status?: LeadStatus;
  courseKey?: CourseKey | null;
  assignedTo?: string | null;
  notes?: string;
}

export interface LeadBulkBody {
  candidateIds: string[];
  status?: LeadStatus;
  assignedTo?: string | null;
}

export type LeadFilterValue = string | string[];

export interface SavedFilter {
  id: string;
  name: string;
  filters: Record<string, LeadFilterValue>;
  createdByName: string;
  updatedAt: string;
}

export type ExportStatus =
  | { status: "pending" }
  | { status: "ready" }
  | { status: "failed"; message?: string };

export interface LeadPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeadListResponse {
  data: LeadRow[];
  pagination: LeadPagination;
}

export interface ValueLabel {
  value: string;
  label: string;
}

export interface LeadOptionsCatalog {
  courses: ValueLabel[];
  workStatuses: ValueLabel[];
  genders: ValueLabel[];
  educationLevels: ValueLabel[];
  leadStatuses: ValueLabel[];
  industries: string[];
  languages: string[];
}

export type OptionSearchField = "skills" | "jobTitles" | "streams";

export interface SearchOption {
  id: string;
  label: string;
}

export type LeadSort = "lastActive" | "signup" | "experience" | "name";

// Query param names, same as the list API.
export const LEAD_LIST_ARRAY_KEYS = [
  "dreamJobTitles",
  "industries",
  "skillsHave",
  "skillsNotHave",
  "languages",
  "educationLevels",
  "fieldOfStudyIds",
  "workStatuses",
  "leadStatuses",
] as const;

export const LEAD_LIST_SCALAR_KEYS = [
  "salaryMin",
  "salaryMax",
  "skillsHaveMode",
  "passingYearFrom",
  "passingYearTo",
  "currentJobTitle",
  "experienceMin",
  "experienceMax",
  "gender",
  "ageMin",
  "ageMax",
  "lastActive",
  "lastActiveFrom",
  "lastActiveTo",
  "signupFrom",
  "signupTo",
  "currentLat",
  "currentLng",
  "currentRadiusKm",
  "currentPlace",
  "dreamJobLat",
  "dreamJobLng",
  "dreamJobRadiusKm",
  "dreamJobPlace",
] as const;

// Everything that counts as a filter (cleared by "Clear all"), plus search.
export const LEAD_FILTER_KEYS: string[] = [
  ...LEAD_LIST_ARRAY_KEYS,
  ...LEAD_LIST_SCALAR_KEYS,
  "search",
];

// Every param the list API accepts.
export const LEAD_LIST_PARAM_KEYS: string[] = [
  ...LEAD_FILTER_KEYS,
  "sort",
  "page",
  "limit",
];

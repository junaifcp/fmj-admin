// src/types/onboarding.ts
export type BusinessSuggestItem = {
  placeId?: string | null;
  name: string;
  description?: string;
  structured?: {
    main_text?: string;
    secondary_text?: string;
    main_text_matched_substrings?: Array<{ length: number; offset: number }>;
  };
  source: "google" | "db" | "manual";
};

export type BusinessSuggestResponse = {
  q: string;
  count: number;
  results: BusinessSuggestItem[];
};

export type ResolvedDetails = {
  placeId?: string;
  name?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  country?: string;
  region?: string;
  city?: string;
  logo?: string;
  email?: string | null;
  postalCode?: string;
  street?: string;
  components?: any;
  source?: "google" | "db" | "manual";
  phone?: string | null;
  internationalPhone?: string | null;
  website?: string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  raw?: any;
  createdAt?: string;
  updatedAt?: string;
  industry?: string;
};

export type BusinessResolveResponse = {
  placeId: string;
  details: ResolvedDetails;
};

export type UpdateRecruiterProfilePayload = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?:
    | string
    | {
        placeId?: string;
        name: string;
        website?: string;
        phone?: string;
        location?: {
          placeId?: string;
          formattedAddress?: string;
          lat?: number;
          lng?: number;
          country?: string;
          region?: string;
          city?: string;
          postalCode?: string;
          street?: string;
          components?: Record<string, string>;
          source?: string;
          raw?: any;
        };
      };
  position?: string;
  profileImageUrl?: string;
  bio?: string;
  location?: {
    placeId?: string;
    formattedAddress?: string;
    lat?: number;
    lng?: number;
    country?: string;
    region?: string;
    city?: string;
    postalCode?: string;
    street?: string;
    components?: Record<string, string>;
    source?: string;
    raw?: any;
  };
  features?: string[];
};

export type SelectedFeature = "hrms" | "recruitment_platform";

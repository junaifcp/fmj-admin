// src/types/businessData.ts
import { Location } from "./location";

export interface BusinessData {
  _id: string;
  keyword: string;
  location: {
    placeId: string;
    formattedAddress: string;
    lat: number;
    lng: number;
    city?: string;
    state?: string;
    country?: string;
  };
  business: {
    placeId: string;
    name: string;
    formattedAddress: string;
    lat: number;
    lng: number;
    rating?: number;
    reviewsCount?: number;
    internationalPhone?: string;
    website?: string;
    emails?: string[];
  };
  scrapedAt: string;
  emailScrapingStatus:
    | "pending"
    | "scraping"
    | "completed"
    | "failed"
    | "skipped"
    | "no_emails";
}

export interface JobStatus {
  jobId: string;
  keyword: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: {
    totalLocations: number;
    completedLocations: number;
    currentLocation: string | null;
    totalBusinesses: number;
    expectedTotal: number;
    percentage: number;
  };
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
}

export interface FilterOptions {
  keywords: Array<{ value: string; count: number }>;
  locationsByKeyword: Record<
    string,
    Array<{ placeId: string; formattedAddress: string; count: number }>
  >;
}

export interface Filters {
  keywords?: string[];
  locationPlaceIds?: string[];
  search?: string;
  minRating?: number;
  hasWebsite?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
}

export interface StartScrapingJobRequest {
  keyword: string;
  locations: Array<{
    placeId: string;
    formattedAddress: string;
    lat: number;
    lng: number;
  }>;
}

export interface StartScrapingJobResponse {
  jobId: string;
  keyword: string;
  totalLocationsRequested: number;
  newLocationsCount: number;
  skippedLocationsCount: number;
  skippedLocations?: Array<{
    placeId: string;
    formattedAddress: string;
  }>;
  locationsCount: number;
  status: "pending" | "running";
  createdAt: string;
}

export interface GetScrapedDataResponse {
  businesses: BusinessData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: Filters;
}

export interface ListJobsResponse {
  // Support both response formats: {jobs, pagination} or {data, meta}
  jobs?: Array<{
    jobId: string;
    keyword: string;
    locationsCount: number;
    status: string;
    progress: {
      totalBusinesses: number;
      expectedTotal: number;
      percentage: number;
    };
    createdAt: string;
  }>;
  data?: Array<{
    jobId: string;
    keyword: string;
    locationsCount: number;
    status: string;
    progress: {
      totalBusinesses: number;
      expectedTotal: number;
      percentage: number;
    };
    createdAt: string;
  }>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

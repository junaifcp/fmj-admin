export interface Location {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  country?: string;
  region?: string;      // administrative area / state
  city?: string;
  postalCode?: string;
  street?: string;
  components?: Record<string, string>;
  source?: 'google' | 'mapbox' | 'here' | 'manual';
  raw?: any;            // raw provider payload (optional)
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  structured?: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceResolveRequest {
  placeId: string;
  source?: 'google' | 'mapbox' | 'here' | 'manual';
}
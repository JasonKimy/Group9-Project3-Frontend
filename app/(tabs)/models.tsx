// Import Place from API service
export interface Place {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  lat: number;
  lon: number;
  city: string;
  description: string;
  // Client-side properties
  visited?: boolean;
  photoUrl?: string;
  distance?: number; // Distance from user in km
}

export interface Deck {
  id: string;
  name: string;
  description: string;
  category: string;
  places: Place[];
  completedCount?: number;
}

export interface CheckIn {
  placeId: string;
  userId?: string;
  latitude: number;
  longitude: number;
  timestamp: Date;
  photoUri?: string;
}

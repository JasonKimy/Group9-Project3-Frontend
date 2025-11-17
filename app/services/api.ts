/**
 * API Service for Wander App
 * Centralizes all API calls to the backend
 */

const API_BASE_URL = 'https://wander-api-196ebd783842.herokuapp.com/api';

export interface Place {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  lat: number;
  lon: number;
  city: string;
  description: string;
}

/**
 * Fetch all places
 */
export async function fetchAllPlaces(): Promise<Place[]> {
  const response = await fetch(`${API_BASE_URL}/places`);
  if (!response.ok) {
    throw new Error(`Failed to fetch places: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch a single place by ID
 */
export async function fetchPlaceById(id: string): Promise<Place> {
  const response = await fetch(`${API_BASE_URL}/places/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch place: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch places by category
 */
export async function fetchPlacesByCategory(category: string): Promise<Place[]> {
  const response = await fetch(`${API_BASE_URL}/places/category/${category}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch places by category: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch places by city
 */
export async function fetchPlacesByCity(city: string): Promise<Place[]> {
  const response = await fetch(`${API_BASE_URL}/places/city/${city}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch places by city: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch places by subcategory
 */
export async function fetchPlacesBySubcategory(subcategory: string): Promise<Place[]> {
  const response = await fetch(`${API_BASE_URL}/places/subcategory/${subcategory}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch places by subcategory: ${response.status}`);
  }
  return response.json();
}

/**
 * Search places by name
 */
export async function searchPlacesByName(name: string): Promise<Place[]> {
  const response = await fetch(`${API_BASE_URL}/places/search?name=${encodeURIComponent(name)}`);
  if (!response.ok) {
    throw new Error(`Failed to search places: ${response.status}`);
  }
  return response.json();
}

/**
 * Search places by description keyword
 */
export async function searchPlacesByDescription(keyword: string): Promise<Place[]> {
  const response = await fetch(`${API_BASE_URL}/places/search/description?keyword=${encodeURIComponent(keyword)}`);
  if (!response.ok) {
    throw new Error(`Failed to search places by description: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch nearby places within a bounding box
 */
export async function fetchNearbyPlaces(
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number
): Promise<Place[]> {
  const response = await fetch(
    `${API_BASE_URL}/places/nearby?minLat=${minLat}&maxLat=${maxLat}&minLon=${minLon}&maxLon=${maxLon}`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch nearby places: ${response.status}`);
  }
  return response.json();
}

/**
 * Filter places by category and/or city
 */
export async function filterPlaces(category?: string, city?: string): Promise<Place[]> {
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (city) params.append('city', city);
  
  const response = await fetch(`${API_BASE_URL}/places/filter?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Failed to filter places: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch all available categories
 */
export async function fetchCategories(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/places/categories`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch all available cities
 */
export async function fetchCities(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/places/cities`);
  if (!response.ok) {
    throw new Error(`Failed to fetch cities: ${response.status}`);
  }
  return response.json();
}

/**
 * Get total count of places
 */
export async function fetchPlacesCount(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/places/count`);
  if (!response.ok) {
    throw new Error(`Failed to fetch places count: ${response.status}`);
  }
  return response.json();
}

/**
 * Calculate distance between two coordinates in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * API Service for Wander App
 * Centralizes all API calls to the backend
 */

const API_BASE_URL = 'https://wander-api-196ebd783842.herokuapp.com/api';

export interface User {
  id: string;
  username: string;
  password?: string; // Optional since we won't always receive it from backend
  email: string;
  createdAt: string;
  updatedAt: string;
}

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

// ============================================
// USER API FUNCTIONS
// ============================================

/**
 * Create a new user account
 */
export async function createUser(
  username: string,
  password: string,
  email: string
): Promise<User> {
  console.log('🔧 API: createUser called');
  console.log('URL:', `${API_BASE_URL}/users`);
  console.log('Payload:', { username, email, passwordLength: password.length });
  
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, email }),
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      
      if (response.status === 409) {
        throw new Error('Username or email already exists');
      }
      throw new Error(`Failed to create user: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ API: User created successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ API: createUser error:', error);
    throw error;
  }
}

/**
 * Get user by username (for login validation)
 */
export async function getUserByUsername(username: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/username/${username}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  return response.json();
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/email/${email}`);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('User not found');
    }
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  return response.json();
}

/**
 * Check if username exists
 */
export async function checkUsernameExists(username: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/users/check/username/${username}`);
  if (!response.ok) {
    throw new Error(`Failed to check username: ${response.status}`);
  }
  return response.json();
}

/**
 * Check if email exists
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/users/check/email/${email}`);
  if (!response.ok) {
    throw new Error(`Failed to check email: ${response.status}`);
  }
  return response.json();
}

/**
 * Login user - validates credentials
 * Note: This is a client-side validation. In production, you should have a dedicated
 * login endpoint on the backend that handles password hashing properly.
 */
export async function loginUser(usernameOrEmail: string, password: string): Promise<User> {
  console.log('🔧 API: loginUser called');
  console.log('Username/Email:', usernameOrEmail);
  
  // Try to get user by username first, then by email
  let user: User;
  try {
    console.log('📡 Trying to fetch user by username...');
    user = await getUserByUsername(usernameOrEmail);
    console.log('✅ Found user by username:', user.username);
  } catch (error) {
    console.log('⚠️ Username not found, trying email...');
    // If username doesn't exist, try email
    try {
      user = await getUserByEmail(usernameOrEmail);
      console.log('✅ Found user by email:', user.username);
    } catch (emailError) {
      console.error('❌ User not found by username or email');
      throw new Error('Invalid username/email or password');
    }
  }

  // Note: In production, password validation should be done on the backend
  // For now, we're doing a simple comparison (not secure for production!)
  console.log('🔒 Validating password...');
  if (user.password !== password) {
    console.error('❌ Password mismatch');
    throw new Error('Invalid username/email or password');
  }

  console.log('✅ Login successful');
  return user;
}

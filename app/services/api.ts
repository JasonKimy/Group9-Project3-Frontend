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
  fav_challenge_1?: string;
  fav_challenge_2?: string;
  avatar_url?: string;
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
  // Client-side properties
  visited?: boolean;
  distance?: number; // Distance from user in km
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
  email: string,
  favChallenge1?: string,
  favChallenge2?: string
): Promise<User> {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        username, 
        password, 
        email,
        fav_challenge_1: favChallenge1,
        fav_challenge_2: favChallenge2
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 409) {
        throw new Error('Username or email already exists');
      }
      throw new Error(`Failed to create user: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
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
  let user: User;
  try {
    user = await getUserByUsername(usernameOrEmail);
  } catch (error) {
    try {
      user = await getUserByEmail(usernameOrEmail);
    } catch (emailError) {
      throw new Error('Invalid username/email or password');
    }
  }

  // Note: In production, password validation should be done on the backend
  // For now, we're doing a simple comparison (not secure for production!)
  if (user.password !== password) {
    throw new Error('Invalid username/email or password');
  }

  return user;
}

// There is likely a more secure way to do this
// We just grab the user with the email we got and log them in
export async function loginOAuth(email: string) : Promise<User> {
  let user: User;
  try {
    user = await getUserByEmail(email);
  } catch (emailError) {
    throw new Error('Account does not exist');
  }
  return user;
}

// ============================================
// DECK API FUNCTIONS
// ============================================

export interface Deck {
  id: number;
  createdAt: string;
  userId: string;
  category: string;
  places: Place[];
}

/**
 * Create a deck for a user with a specific category
 */
export async function createDeck(userId: string, category: string): Promise<Deck> {
  const response = await fetch(`${API_BASE_URL}/decks?userId=${userId}&category=${category}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to create deck: ${response.status}`);
  }
  return response.json();
}

/**
 * Get all decks for a user
 */
export async function getUserDecks(userId: string): Promise<Deck[]> {
  const response = await fetch(`${API_BASE_URL}/decks/user/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user decks: ${response.status}`);
  }
  return response.json();
}

/**
 * Get a specific deck by ID
 */
export async function getDeckById(deckId: number): Promise<Deck> {
  const response = await fetch(`${API_BASE_URL}/decks/${deckId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch deck: ${response.status}`);
  }
  return response.json();
}

/**
 * Delete a deck
 */
export async function deleteDeck(deckId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Failed to delete deck: ${response.status}`);
  }
}

// ============= Check-in Functions =============

export interface CheckIn {
  id: string;
  userId: string;
  placeId: string;
  timestamp: string;
  photoUri?: string;
}

export interface CheckInWithPlace extends CheckIn {
  place: Place;
}

/**
 * Get all check-ins for a user
 */
export async function getUserCheckIns(userId: string): Promise<CheckIn[]> {
  const response = await fetch(`${API_BASE_URL}/checkins/user/${userId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user check-ins: ${response.status}`);
  }
  return response.json();
}

/**
 * Create a new check-in
 */
export async function createCheckIn(userId: string, placeId: string, photoUri?: string): Promise<CheckIn> {
  const response = await fetch(`${API_BASE_URL}/checkins`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, placeId, photoUri }),
  });
  if (!response.ok) {
    throw new Error(`Failed to create check-in: ${response.status}`);
  }
  return response.json();
}

// ============= User Update Functions =============

/**
 * Update user's favorite challenges
 */
export async function updateUserFavoriteChallenges(
  userId: string,
  favChallenge1: string,
  favChallenge2: string
): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/favorites`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fav_challenge_1: favChallenge1,
      fav_challenge_2: favChallenge2,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update favorite challenges: ${response.status}`);
  }
  return response.json();
}

/**
 * Update user's avatar URL
 */
export async function updateUserAvatar(userId: string, avatarUrl: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ avatarUrl }),
  });
  if (!response.ok) {
    throw new Error(`Failed to update avatar: ${response.status}`);
  }
  return response.json();
}

import {
    fireEvent,
    render,
    waitFor,
} from '@testing-library/react-native';
import * as Location from 'expo-location';
import React from 'react';
import { Alert } from 'react-native';
import { calculateDistance, getDeckById } from '../../services/api';
import DeckScreen from '../DeckScreen';

// --- Mock expo-router (with deckId) ---

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    deckId: '1',
  }),
}));

// --- Mock expo-location ---

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

// --- Mock services/api ---

jest.mock('../../services/api', () => ({
  getDeckById: jest.fn(),
  calculateDistance: jest.fn(),
  getUserCheckIns: jest.fn(),
}));

// --- Mock AsyncStorage ---
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserCheckIns } from '../../services/api';

const mockUser = {
  id: 'user-123',
  username: 'testUser',
  points: 100,
};

beforeEach(() => {
  jest.clearAllMocks();

  // Mock AsyncStorage to return a user
  (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUser));
  
  // Mock getUserCheckIns to return empty array by default
  (getUserCheckIns as jest.Mock).mockResolvedValue([]);

  // Default: deny location permission so userLocation stays null,
  // tests can override this when needed.
  (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
    status: 'denied',
  });
  (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
    coords: { latitude: 0, longitude: 0 },
  });
});

describe('DeckScreen', () => {
  it('shows empty state when deck has no places and Go Back navigates home', async () => {
    (getDeckById as jest.Mock).mockResolvedValue({
      id: 1,
      category: 'coffee_shop',
      places: [],
    });

    const { getByText } = render(<DeckScreen />);

    await waitFor(() => {
      expect(
        getByText('No places found in this deck.')
      ).toBeTruthy();
    });

    fireEvent.press(getByText('Go Back'));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/HomeScreen');
  });

  it('renders deck details with places, visited badge and distance, and navigates to check-in on press', async () => {
    // For this test, allow location and provide a fixed location
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 10, longitude: 20 },
    });

    // Mock getUserCheckIns to return one checked-in place
    (getUserCheckIns as jest.Mock).mockResolvedValue([
      { placeId: 'p2' } // p2 (Near Cafe) has been visited
    ]);

    (getDeckById as jest.Mock).mockResolvedValue({
      id: 1,
      category: 'coffee_shop',
      places: [
        {
          id: 'p1',
          name: 'Far Cafe',
          city: 'San Francisco',
          description: 'Far away cafe',
          lat: 1,
          lon: 2,
          visited: false,
        },
        {
          id: 'p2',
          name: 'Near Cafe',
          city: 'San Francisco',
          description: 'Nearby cafe',
          lat: 3,
          lon: 4,
          visited: true,
        },
      ],
    });

    // Distances in KM
    (calculateDistance as jest.Mock)
      .mockReturnValueOnce(2) // for p1
      .mockReturnValueOnce(1); // for p2

    const { getByText, getAllByText } = render(<DeckScreen />);

    await waitFor(() => {
      // Header uses formatted category name: "Coffee Shops"
      expect(getByText('Coffee Shops')).toBeTruthy();

      // Description: Explore 2 amazing coffee shops locations
      expect(
        getByText('Explore 2 amazing coffee shops locations')
      ).toBeTruthy();

      // Place names
      expect(getByText('Far Cafe')).toBeTruthy();
      expect(getByText('Near Cafe')).toBeTruthy();

      // Cities (there are two "San Francisco" labels)
      const cityLabels = getAllByText('San Francisco');
      expect(cityLabels.length).toBe(2);

      // Visited place should be disabled (not clickable)
      // The "Near Cafe" card should be marked as visited
      // We can verify by checking that it doesn't navigate when pressed

      // Distance text like "📍 0.62 miles away" (exact number may vary)
      const distanceLabels = getAllByText(/miles away/);
      expect(distanceLabels.length).toBeGreaterThan(0);
    });

    // Pressing a non-visited place navigates to /checkin/:id
    // Near Cafe is visited, so press Far Cafe instead
    fireEvent.press(getByText('Far Cafe'));

    expect(mockPush).toHaveBeenCalledWith('/checkin/p1');
    
    // Verify that pressing a visited place doesn't navigate
    mockPush.mockClear();
    fireEvent.press(getByText('Near Cafe'));
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows an alert when deck fetching fails and falls back to empty state', async () => {
    (getDeckById as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const alertSpy = jest
      .spyOn(Alert, 'alert')
      .mockImplementation(() => {});
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { getByText } = render(<DeckScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Failed to load deck. Please try again.'
      );
      // Because deck stays null / empty, we should see the empty message
      expect(
        getByText('No places found in this deck.')
      ).toBeTruthy();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching deck:',
      expect.any(Error)
    );

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

// app/(tabs)/__tests__/CheckInScreen.test.tsx
import React from 'react';
import { Alert } from 'react-native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import * as Location from 'expo-location';

import CheckInScreen from '../CheckInScreen';
import { fetchPlaceById, calculateDistance } from '../../services/api';

// Mock expo-router for params + navigation
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    placeId: 'place-1',
  }),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { High: 'high' },
}));

// Mock services/api
jest.mock('../../services/api', () => ({
  fetchPlaceById: jest.fn(),
  calculateDistance: jest.fn(),
}));

describe('CheckInScreen', () => {
  const mockPlace = {
    id: 'place-1',
    name: 'Cool Cafe',
    category: 'coffee_shop',
    city: 'Seattle',
    description: 'Great coffee and vibes.',
    lat: 47.6062,
    lon: -122.3321,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: permission denied so location effect does almost nothing
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'denied',
    });
    // Stub alert so it doesn't actually show
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders place details when fetchPlaceById succeeds', async () => {
    (fetchPlaceById as jest.Mock).mockResolvedValue(mockPlace);

    const { getByText } = render(<CheckInScreen />);

    // Wait for place data to be applied
    await waitFor(() => {
      expect(getByText('Cool Cafe')).toBeTruthy();
    });

    // Category is transformed to uppercase and joined with city
    expect(getByText('COFFEE SHOP • Seattle')).toBeTruthy();
    expect(getByText('Great coffee and vibes.')).toBeTruthy();
  });

  it('shows error alert and "Place not found." when fetching place fails', async () => {
    (fetchPlaceById as jest.Mock).mockRejectedValue(new Error('Network error'));

    const { getByText } = render(<CheckInScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load place details.');
    });

    // Fallback UI when place is null
    expect(getByText('Place not found.')).toBeTruthy();
  });

  it('allows check-in when within radius and shows success alert', async () => {
    (fetchPlaceById as jest.Mock).mockResolvedValue(mockPlace);

    // Now we want location allowed
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: 47.6062,
        longitude: -122.3321,
      },
    });

    // Within 0.5 km radius
    (calculateDistance as jest.Mock).mockReturnValue(0.1);

    const { getByText } = render(<CheckInScreen />);

    // Wait until the button reflects "within radius" state
    await waitFor(() => {
      expect(getByText('✓ Check In Now')).toBeTruthy();
    });

    fireEvent.press(getByText('✓ Check In Now'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '✓ Check-In Successful!',
      "You've checked in at Cool Cafe!",
      expect.any(Array)
    );
  });
});

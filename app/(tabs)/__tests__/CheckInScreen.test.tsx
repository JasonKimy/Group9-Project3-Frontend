// app/(tabs)/__tests__/CheckInScreen.test.tsx
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import React from 'react';
import { Alert } from 'react-native';

import { calculateDistance, fetchPlaceById } from '../../services/api';
import CheckInScreen from '../CheckInScreen';

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
  createCheckIn: jest.fn(),
  addPointsToUser: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const mockUser = {
    id: 'user-123',
    username: 'testUser',
    points: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock AsyncStorage to return a user
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(mockUser));
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

  it('shows error alert when fetching place fails', async () => {
    (fetchPlaceById as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<CheckInScreen />);

    // Verify error alert is shown
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load place details.');
    });
    
    // Note: The "Place not found." UI appears after a 10-second timeout in the actual app,
    // but testing this with fake timers causes issues with animations, so we just verify the alert
  });

  it('allows check-in when within radius and shows success alert', async () => {
    const { createCheckIn, addPointsToUser } = require('../../services/api');
    
    (fetchPlaceById as jest.Mock).mockResolvedValue(mockPlace);
    (createCheckIn as jest.Mock).mockResolvedValue({ id: 'checkin-1', userId: 'user-123', placeId: 'place-1' });
    (addPointsToUser as jest.Mock).mockResolvedValue({ ...mockUser, points: 150 });

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

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '✓ Check-In Successful!',
        "You've checked in at Cool Cafe and earned 50 points!"
      );
    });
  });
});

// app/__tests__/DeckScreen.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DeckScreen from '../(tabs)/DeckScreen';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ status: 'granted' })
  ),
  getCurrentPositionAsync: jest.fn(() =>
    Promise.resolve({ coords: { latitude: 0, longitude: 0 } })
  ),
}));

// Provide a deck id via router search params
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'parks' }),
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

jest.mock('../services/api', () => ({
  fetchCategories: jest.fn(() => Promise.resolve(['parks'])),
  fetchPlacesByCategory: jest.fn(() =>
    Promise.resolve([
      { id: '1', name: 'Place 1', category: 'parks', latitude: 0, longitude: 0 },
    ])
  ),
  calculateDistance: jest.fn(() => 0.42),
}));

test('renders DeckScreen correctly', async () => {
  const { getByText } = render(<DeckScreen />);

  // If your UI shows a title, you can target that instead.
  // Using "Go Back" which appears in your render tree reliably.
  await waitFor(() => {
    expect(getByText('Go Back')).toBeTruthy();
  });
});

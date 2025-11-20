// app/__tests__/HomeScreen.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../(tabs)/HomeScreen';

jest.mock('../services/api', () => ({
  fetchCategories: jest.fn(() => Promise.resolve(['coffee_shop'])),
  fetchPlacesByCategory: jest.fn(() =>
    Promise.resolve([{ id: '1', name: 'Place 1' }])
  ),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

test('renders HomeScreen correctly', async () => {
  const { getByText } = render(<HomeScreen />);
  await waitFor(() => {
    expect(getByText("This Week's Challenges")).toBeTruthy();
  });
});

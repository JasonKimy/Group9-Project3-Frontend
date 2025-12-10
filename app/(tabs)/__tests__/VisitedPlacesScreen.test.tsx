// app/(tabs)/__tests__/VisitedPlacesScreen.test.tsx
import React from 'react';
import { render, waitFor, fireEvent, act, } from '@testing-library/react-native';
import VisitedPlacesScreen from '../VisitedPlacesScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserCheckIns, fetchPlaceById } from '../../services/api';
import { FlatList, Alert } from 'react-native';


// IMPORTANT: name must start with "mock" so Jest allows it in jest.mock factory
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

// Mock API services
jest.mock('../../services/api', () => ({
  getUserCheckIns: jest.fn(),
  fetchPlaceById: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('VisitedPlacesScreen', () => {
  it('shows empty state when there are no check-ins', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'user123' })
    );

    (getUserCheckIns as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<VisitedPlacesScreen />);

    await waitFor(() => {
      expect(getByText('No visits yet!')).toBeTruthy();
      expect(
        getByText(
          'Start exploring and checking in to places to build your collection.'
        )
      ).toBeTruthy();
    });
  });

  it('renders a list item when there is at least one check-in', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'user123' })
    );

    (getUserCheckIns as jest.Mock).mockResolvedValue([
      {
        id: 'checkin-1',
        placeId: 'place-1',
        timestamp: '2025-01-01T00:00:00.000Z',
        photoUri: 'https://example.com/photo.jpg',
      },
    ]);

    (fetchPlaceById as jest.Mock).mockResolvedValue({
      id: 'place-1',
      name: 'Cool Museum',
      category: 'museum',
      city: 'Seattle',
      description: 'A very cool museum.',
    });

    const { getByText, queryByText } = render(<VisitedPlacesScreen />);

    await waitFor(() => {
      // Should NOT show empty state
      expect(queryByText('No visits yet!')).toBeNull();

      // Should show place details
      expect(getByText('Cool Museum')).toBeTruthy();
      expect(getByText('Museum • Seattle')).toBeTruthy();
      expect(getByText('A very cool museum.')).toBeTruthy();

      // Should show header count
      expect(getByText('1 places visited')).toBeTruthy();
    });
  });

  // ▶️ Test 3 — pressing a check-in navigates to /checkin/:id
  it('navigates to check-in detail when a card is pressed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'user123' })
    );

    (getUserCheckIns as jest.Mock).mockResolvedValue([
      {
        id: 'checkin-1',
        placeId: 'place-1',
        timestamp: '2025-01-01T00:00:00.000Z',
        photoUri: null,
      },
    ]);

    (fetchPlaceById as jest.Mock).mockResolvedValue({
      id: 'place-1',
      name: 'Cool Museum',
      category: 'museum',
      city: 'Seattle',
      description: 'A very cool museum.',
    });

    const { getByText } = render(<VisitedPlacesScreen />);

    await waitFor(() => {
      expect(getByText('Cool Museum')).toBeTruthy();
    });

    // Pressing the text should trigger the parent TouchableOpacity's onPress
    fireEvent.press(getByText('Cool Museum'));

    expect(mockPush).toHaveBeenCalledWith('/checkin/place-1');
  });

  // ▶️ Test 4 — date formatting (Today, Yesterday, N days ago)
  it('formats timestamps as Today, Yesterday, and N days ago', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-10T12:00:00.000Z'));

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'user123' })
    );

    (getUserCheckIns as jest.Mock).mockResolvedValue([
      {
        id: 'checkin-today',
        placeId: 'place-1',
        timestamp: '2025-01-10T08:00:00.000Z', // same day
        photoUri: null,
      },
      {
        id: 'checkin-yesterday',
        placeId: 'place-2',
        timestamp: '2025-01-09T10:00:00.000Z', // day before
        photoUri: null,
      },
      {
        id: 'checkin-3days',
        placeId: 'place-3',
        timestamp: '2025-01-07T12:00:00.000Z', // 3 days before
        photoUri: null,
      },
    ]);

    (fetchPlaceById as jest.Mock).mockResolvedValue({
      id: 'place',
      name: 'Any Place',
      category: 'museum',
      city: 'Seattle',
      description: 'Some description',
    });

    const { getByText } = render(<VisitedPlacesScreen />);

    await waitFor(() => {
      expect(getByText('Today')).toBeTruthy();
      expect(getByText('Yesterday')).toBeTruthy();
      expect(getByText('3 days ago')).toBeTruthy();
    });
  });

  // ▶️ Test 5 — refresh behavior
  it('calls getUserCheckIns again when pulled to refresh', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'user123' })
    );

    (getUserCheckIns as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 'checkin-1',
          placeId: 'place-1',
          timestamp: '2025-01-01T00:00:00.000Z',
          photoUri: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'checkin-2',
          placeId: 'place-2',
          timestamp: '2025-01-02T00:00:00.000Z',
          photoUri: null,
        },
      ]);

    (fetchPlaceById as jest.Mock).mockResolvedValue({
      id: 'place-1',
      name: 'Cool Museum',
      category: 'museum',
      city: 'Seattle',
      description: 'A very cool museum.',
    });

    const { getByText, UNSAFE_getByType } = render(<VisitedPlacesScreen />);

    // Wait for first load
    await waitFor(() => {
      expect(getByText('Cool Museum')).toBeTruthy();
    });

    // Trigger onRefresh inside act to avoid warnings
    const list = UNSAFE_getByType(FlatList as any);
    const refreshControl = list.props.refreshControl;

    await act(async () => {
      refreshControl.props.onRefresh();
    });

    await waitFor(() => {
      expect(getUserCheckIns).toHaveBeenCalledTimes(2);
    });
  });

  // ▶️ Test 6 — error handling (Alert.alert)
  it('shows an alert when loading check-ins fails', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'user123' })
    );

    (getUserCheckIns as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(<VisitedPlacesScreen />);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Failed to load visited places. Please try again.'
      );
    });

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
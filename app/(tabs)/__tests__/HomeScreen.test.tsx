import React from 'react';
import {
  render,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react-native';
import HomeScreen from '../HomeScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native';
import { getUserDecks, getFriendsWithDecks } from '../../services/api';

// Router mock (must start with "mock" for Jest)
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

// API mock
jest.mock('../../services/api', () => ({
  getUserDecks: jest.fn(),
  getFriendsWithDecks: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('HomeScreen', () => {
  it('renders with 0 places when there is no user in storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('WANDER')).toBeTruthy();
      expect(getByText("This Week’s Challenges")).toBeTruthy();
    });

    // No user -> no decks -> total places 0
    expect(getByText('Explore 0 amazing places')).toBeTruthy();
    expect(getUserDecks).not.toHaveBeenCalled();
    expect(getFriendsWithDecks).not.toHaveBeenCalled();
  });

  it('renders user decks and friends decks with correct text', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: '../assets/Wander-Avatars/Normal/Normal1.png',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    (getUserDecks as jest.Mock).mockResolvedValue([
      {
        id: 1,
        category: 'coffee_shop',
        places: [{ id: 'p1' }, { id: 'p2' }],
      },
      {
        id: 2,
        category: 'park',
        places: [{ id: 'p3' }],
      },
    ]);

    (getFriendsWithDecks as jest.Mock).mockResolvedValue([
      {
        id: 'f1',
        username: 'Alice',
        avatar_url: '../assets/Wander-Avatars/Normal/Normal2.png',
        decks: [
          {
            id: 3,
            category: 'beach',
            places: [{ id: 'p4' }, { id: 'p5' }, { id: 'p6' }],
          },
        ],
      },
    ]);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      // Header
      expect(getByText('WANDER')).toBeTruthy();
      expect(getByText("This Week’s Challenges")).toBeTruthy();

      // Total places: 2 + 1 = 3
      expect(getByText('Explore 3 amazing places')).toBeTruthy();

      // User decks
      expect(getByText('Coffee Shop')).toBeTruthy();
      expect(
        getByText('Discover amazing coffee spots • 2 places')
      ).toBeTruthy();

      expect(getByText('Park')).toBeTruthy();
      expect(
        getByText('Visit beautiful outdoor spaces • 1 place')
      ).toBeTruthy();

      // Friends section
      expect(getByText("Friends' Decks")).toBeTruthy();
      expect(
        getByText('See what your friends are exploring')
      ).toBeTruthy();

      expect(getByText('Beach')).toBeTruthy();
      expect(
        getByText("Alice's deck • 3 places")
      ).toBeTruthy();
    });
  });

  it('navigates to deck screen when a user deck card is pressed', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: '../assets/Wander-Avatars/Normal/Normal1.png',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    (getUserDecks as jest.Mock).mockResolvedValue([
      {
        id: 1,
        category: 'coffee_shop',
        places: [{ id: 'p1' }],
      },
    ]);

    (getFriendsWithDecks as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Coffee Shop')).toBeTruthy();
    });

    // Pressing the card text triggers parent TouchableOpacity
    fireEvent.press(getByText('Coffee Shop'));

    expect(mockPush).toHaveBeenCalledWith('/deck/1');
  });

  it('calls loaders again when pulled to refresh', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: '../assets/Wander-Avatars/Normal/Normal1.png',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    (getUserDecks as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: 1,
          category: 'coffee_shop',
          places: [{ id: 'p1' }],
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 2,
          category: 'park',
          places: [{ id: 'p2' }],
        },
      ]);

    (getFriendsWithDecks as jest.Mock)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const { getByText, UNSAFE_getByType } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('Coffee Shop')).toBeTruthy();
    });

    const scrollView = UNSAFE_getByType(ScrollView as any);
    const refreshControl = scrollView.props.refreshControl;

    await act(async () => {
      refreshControl.props.onRefresh();
    });

    await waitFor(() => {
      // Initial load + refresh
      expect(getUserDecks).toHaveBeenCalledTimes(2);
      expect(getFriendsWithDecks).toHaveBeenCalledTimes(2);
    });
  });

  it('handles errors when loading decks by showing 0 places', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: '../assets/Wander-Avatars/Normal/Normal1.png',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    (getUserDecks as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );
    (getFriendsWithDecks as jest.Mock).mockResolvedValue([]);

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('WANDER')).toBeTruthy();
      expect(getByText('Explore 0 amazing places')).toBeTruthy();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error loading decks:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});

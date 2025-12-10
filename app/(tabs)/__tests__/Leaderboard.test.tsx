import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import Leaderboard from '../leaderboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

// Mock global fetch
const mockFetch = jest.fn();

beforeAll(() => {
  (global as any).fetch = mockFetch;
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFetch.mockReset();
});

describe('Leaderboard screen', () => {
  it('does not fetch leaderboards when no user is in AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    render(<Leaderboard />);

    // Wait a tick for useEffect to run
    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  it('renders global and friends leaderboards and shows current user ranks when not in top 5', async () => {
    const mockUser = {
      id: 'u1',
      username: 'MeUser',
      points: 120,
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    // 1) Global leaderboard (user NOT included)
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'u2', username: 'Alice', points: 300 },
          { id: 'u3', username: 'Bob', points: 250 },
        ],
      } as any)
      // 2) Friends leaderboard (user NOT included)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'u4', username: 'Charlie', points: 200 },
        ],
      } as any)
      // 3) Global rank for current user (outside top 5)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => 10,
      } as any)
      // 4) Friends rank for current user (outside top 5)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => 7,
      } as any);

    const { getByText, queryByText } = render(<Leaderboard />);

    await waitFor(() => {
      // Header
      expect(getByText('Leaderboards')).toBeTruthy();

      // Global leaderboard entries
      expect(getByText('Alice')).toBeTruthy();
      expect(getByText('300 pts')).toBeTruthy();
      expect(getByText('Bob')).toBeTruthy();
      expect(getByText('250 pts')).toBeTruthy();

      // Friends leaderboard entries
      expect(getByText('Friends Leaderboard')).toBeTruthy();
      expect(getByText('Charlie')).toBeTruthy();
      expect(getByText('200 pts')).toBeTruthy();

      // "No friends leaderboard" should NOT show
      expect(
        queryByText('No friends leaderboard available')
      ).toBeNull();

      // Current user rank below each leaderboard (not in top 5)
      expect(
        getByText('10. MeUser — 120 pts')
      ).toBeTruthy();
      expect(
        getByText('7. MeUser — 120 pts')
      ).toBeTruthy();
    });
  });

  it('shows empty friends leaderboard text when there are no friends', async () => {
    const mockUser = {
      id: 'u1',
      username: 'MeUser',
      points: 50,
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch
      // Global leaderboard
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { id: 'u2', username: 'Alice', points: 300 },
        ],
      } as any)
      // Friends leaderboard: empty
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any)
      // Global rank
      .mockResolvedValueOnce({
        ok: true,
        json: async () => 8,
      } as any)
      // Friends rank (won't really matter because there are no friends)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => 1,
      } as any);

    const { getByText } = render(<Leaderboard />);

    await waitFor(() => {
      expect(getByText('Leaderboards')).toBeTruthy();
      // Global list is present
      expect(getByText('Alice')).toBeTruthy();
      // Friends section shows empty state text
      expect(
        getByText('No friends leaderboard available')
      ).toBeTruthy();
    });
  });

  it('shows an error message when fetch throws', async () => {
    const mockUser = {
      id: 'u1',
      username: 'MeUser',
      points: 99,
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<Leaderboard />);

    await waitFor(() => {
      expect(getByText('Error: Network error')).toBeTruthy();
    });
  });
});

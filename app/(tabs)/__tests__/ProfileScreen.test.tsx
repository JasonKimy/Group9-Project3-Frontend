// app/(tabs)/__tests__/ProfileScreentest.tsx
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import ProfileScreen from '../ProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  updateUserAvatar,
  updateUserFavoriteChallenges,
  updateUserDecks,
} from '../../services/api';

// Router mock
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: jest.fn(),
  }),
}));

// AsyncStorage mock
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// API mock
jest.mock('../../services/api', () => ({
  updateUserAvatar: jest.fn(),
  updateUserFavoriteChallenges: jest.fn(),
  updateUserDecks: jest.fn(),
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

describe('ProfileScreen', () => {
  it('redirects to LoginScreen when there is no user in AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    render(<ProfileScreen />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/LoginScreen');
    });
  });

  it('loads user data and displays username and stats', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: undefined,
      fav_challenge_1: 'coffee_shop',
      fav_challenge_2: 'park',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1 }, { id: 2 }], // 2 check-ins
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1 }, { id: 2 }, { id: 3 }], // 3 friends
      } as any);

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Profile')).toBeTruthy();
      expect(getByText('Magda')).toBeTruthy();
    });

    expect(getByText('Places Visited')).toBeTruthy();
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('2')).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });

  it('logs out and navigates to LoginScreen', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: undefined,
      fav_challenge_1: 'coffee_shop',
      fav_challenge_2: 'park',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Logout')).toBeTruthy();
    });

    fireEvent.press(getByText('Logout'));

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('user');

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/LoginScreen');
    });
  });

  it('opens avatar modal when avatar is pressed', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: undefined,
      fav_challenge_1: 'coffee_shop',
      fav_challenge_2: 'park',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

    const { getByText, getByTestId } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Magda')).toBeTruthy();
    });

    fireEvent.press(getByTestId('avatar-button'));

    await waitFor(() => {
      expect(getByText('Choose Your Avatar')).toBeTruthy();
    });
  });

  it('saves avatar and updates user and storage', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: undefined,
      fav_challenge_1: 'coffee_shop',
      fav_challenge_2: 'park',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

    (updateUserAvatar as jest.Mock).mockResolvedValue({
      ...mockUser,
      avatar_url: '../assets/Wander-Avatars/Normal/Normal1.png',
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getByTestId } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Magda')).toBeTruthy();
    });

    fireEvent.press(getByTestId('avatar-button'));

    await waitFor(() => {
      expect(getByText('Choose Your Avatar')).toBeTruthy();
    });

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(updateUserAvatar).toHaveBeenCalledTimes(1);
      expect(updateUserAvatar).toHaveBeenCalledWith(
        'user123',
        expect.stringMatching(/Wander-Avatars\/Normal\/Normal\d+\.png/)
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user',
        expect.any(String)
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        'Avatar updated successfully!'
      );
    });

    alertSpy.mockRestore();
  });

  it('shows error when saving challenges with missing selections', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: undefined,
      fav_challenge_1: '',
      fav_challenge_2: '',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Favorite Challenges')).toBeTruthy();
    });

    fireEvent.press(getByText('Favorite Challenges'));

    await waitFor(() => {
      expect(getByText('Update Favorite Challenges')).toBeTruthy();
    });

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Please select both favorite challenges'
      );
    });

    alertSpy.mockRestore();
  });

  it('shows error when saving challenges with the same selection', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: undefined,
      fav_challenge_1: '',
      fav_challenge_2: '',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getAllByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Favorite Challenges')).toBeTruthy();
    });

    fireEvent.press(getByText('Favorite Challenges'));

    await waitFor(() => {
      expect(getByText('Update Favorite Challenges')).toBeTruthy();
    });

    const coffeeTexts = getAllByText('Coffee Shop');

    // Set both fav1 and fav2 to "Coffee Shop"
    fireEvent.press(coffeeTexts[0]);
    fireEvent.press(coffeeTexts[1]);

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Please select two different challenges'
      );
    });

    alertSpy.mockRestore();
  });

  it('saves favorite challenges and updates decks and storage', async () => {
    const mockUser = {
      id: 'user123',
      username: 'Magda',
      avatar_url: undefined,
      fav_challenge_1: 'gym',
      fav_challenge_2: 'trail',
    };

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(mockUser)
    );

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as any);

    (updateUserFavoriteChallenges as jest.Mock).mockResolvedValue({
      ...mockUser,
      fav_challenge_1: 'coffee_shop',
      fav_challenge_2: 'park',
    });

    (updateUserDecks as jest.Mock).mockResolvedValue(undefined);

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

    const { getByText, getAllByText } = render(<ProfileScreen />);

    await waitFor(() => {
      expect(getByText('Favorite Challenges')).toBeTruthy();
    });

    fireEvent.press(getByText('Favorite Challenges'));

    await waitFor(() => {
      expect(getByText('Update Favorite Challenges')).toBeTruthy();
    });

    const coffeeTexts = getAllByText('Coffee Shop');
    const parkTexts = getAllByText('Park');

    // Favorite 1: Coffee Shop (first section)
    fireEvent.press(coffeeTexts[0]);
    // Favorite 2: Park (second section)
    fireEvent.press(parkTexts[1]);

    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(updateUserFavoriteChallenges).toHaveBeenCalledWith(
        'user123',
        'coffee_shop',
        'park'
      );
      expect(updateUserDecks).toHaveBeenCalledWith(
        'user123',
        'gym',
        'trail',
        'coffee_shop',
        'park'
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'user',
        expect.any(String)
      );
      expect(alertSpy).toHaveBeenCalledWith(
        'Success',
        'Favorite challenges and decks updated successfully!'
      );
    });

    alertSpy.mockRestore();
  });
});

import React from 'react';
import {
  render,
  waitFor,
  fireEvent,
} from '@testing-library/react-native';
import Friends from '../friends';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
}));

const mockFetch = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  (global as any).fetch = mockFetch;
});

describe('Friends screen', () => {
  it('renders all sections with empty messages when there is no data', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'u1', username: 'Me' })
    );

    // All friend lists empty, user lookups never needed
    mockFetch.mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => [],
      } as any)
    );

    const { getByText } = render(<Friends />);

    await waitFor(() => {
      expect(getByText('My Friends')).toBeTruthy();
    });

    // Section titles
    expect(getByText('Friends')).toBeTruthy();
    expect(getByText('Pending Requests')).toBeTruthy();
    expect(getByText('Incoming Requests')).toBeTruthy();
    expect(getByText('Blocked Users')).toBeTruthy();
    expect(getByText('Add a Friend')).toBeTruthy();

    // Empty states
    expect(getByText('No friends')).toBeTruthy();
    expect(getByText('No pending requests')).toBeTruthy();
    expect(getByText('No incoming requests')).toBeTruthy();
    expect(getByText('No blocked users')).toBeTruthy();
  });

  it('sends a friend request and clears the input', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'u1', username: 'Me' })
    );

    // Basic routing: empty lists for initial/refresh fetches, and specific
    // responses for username lookup and request POST
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes('/users/username/')) {
        // Username lookup
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 'friend123', username: 'friendUser' }),
        } as any);
      }

      if (url.includes('/friends/request')) {
        // Friend request POST
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as any);
      }

      // Default: all lists empty for fetchFriends()
      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as any);
    });

    const { getByText, getByPlaceholderText } = render(<Friends />);

    await waitFor(() => {
      expect(getByText('My Friends')).toBeTruthy();
    });

    const input = getByPlaceholderText('Enter username');

    fireEvent.changeText(input, 'bob');

    fireEvent.press(getByText('Send Request'));

    await waitFor(() => {
      // Username lookup called with bob
      const hasUsernameCall = mockFetch.mock.calls.some(
        ([url]) =>
          typeof url === 'string' &&
          url.includes('/users/username/bob')
      );
      expect(hasUsernameCall).toBe(true);

      // Friend request POST called with expected body
      const hasRequestCall = mockFetch.mock.calls.some(
        ([url, options]) =>
          typeof url === 'string' &&
          url.includes('/friends/request') &&
          options &&
          options.method === 'POST' &&
          options.body ===
            JSON.stringify({
              senderId: 'u1',
              receiverId: 'friend123',
            })
      );
      expect(hasRequestCall).toBe(true);

      // Input cleared
      expect(
        getByPlaceholderText('Enter username').props.value
      ).toBe('');
    });
  });

  it('accepts an incoming friend request and calls correct endpoint', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ id: 'u1', username: 'Me' })
    );

    const friendsData: any[] = [];
    const pendingData: any[] = [];
    const incomingData: any[] = [
      {
        id: 'req1',
        friend_1_id: 'otherUserId',
        friend_2_id: 'u1',
        status: 'pending',
        username: '',
      },
    ];
    const blockedData: any[] = [];

    mockFetch.mockImplementation((url: string, options?: any) => {
      // Initial lists
      if (url.endsWith('/friends/u1')) {
        return Promise.resolve({
          ok: true,
          json: async () => friendsData,
        } as any);
      }
      if (url.endsWith('/friends/sent/u1')) {
        return Promise.resolve({
          ok: true,
          json: async () => pendingData,
        } as any);
      }
      if (url.endsWith('/friends/incoming/u1')) {
        return Promise.resolve({
          ok: true,
          json: async () => incomingData,
        } as any);
      }
      if (url.endsWith('/friends/blocked/u1')) {
        return Promise.resolve({
          ok: true,
          json: async () => blockedData,
        } as any);
      }

      // User lookup for incoming request
      if (url.includes('/users/otherUserId')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 'otherUserId',
            username: 'IncomingUser',
          }),
        } as any);
      }

      // Accept request
      if (url.includes('/friends/accept/req1')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        } as any);
      }

      // Subsequent refresh calls -> just empty
      if (url.includes('/friends')) {
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as any);
      }

      return Promise.resolve({
        ok: true,
        json: async () => [],
      } as any);
    });

    const { getByText } = render(<Friends />);

    // Wait for incoming request username to resolve through user lookup
    await waitFor(() => {
      expect(getByText('IncomingUser')).toBeTruthy();
    });

    fireEvent.press(getByText('Accept'));

    await waitFor(() => {
      const hasAcceptCall = mockFetch.mock.calls.some(
        ([url, options]) =>
          typeof url === 'string' &&
          url.includes('/friends/accept/req1') &&
          options &&
          options.method === 'POST'
      );
      expect(hasAcceptCall).toBe(true);
    });
  });
});

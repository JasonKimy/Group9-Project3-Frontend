// app/__tests__/LoginScreen.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AuthScreen from '../LoginScreen';
import { useRouter } from 'expo-router';

// Mock the router to prevent actual navigation
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
  })),
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.alert as jest.Mock).mockClear();
  });

  it('renders login form correctly', () => {
    const { getByText, getByTestId } = render(<AuthScreen />);
    expect(getByTestId('login-button')).toBeTruthy();
    expect(getByText("Don't have an account? Create one")).toBeTruthy();
  });

  it('shows alert if email or password is empty', () => {
    const { getByTestId } = render(<AuthScreen />);
    fireEvent.press(getByTestId('login-button'));
    expect(global.alert).toHaveBeenCalled();
  });

  it('toggles to create account mode', () => {
    const { getByText, getByTestId, queryByTestId } = render(<AuthScreen />);
    fireEvent.press(getByText("Don't have an account? Create one"));
    expect(queryByTestId('login-button')).toBeNull();
    expect(getByTestId('create-button')).toBeTruthy();
    expect(getByText('Already have an account? Login')).toBeTruthy();
  });

  it('shows alert if passwords do not match when creating account', () => {
    const { getByText, getByPlaceholderText, getByTestId } = render(<AuthScreen />);
    fireEvent.press(getByText("Don't have an account? Create one"));
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password1');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'password2');
    fireEvent.press(getByTestId('create-button'));
    expect(global.alert).toHaveBeenCalled();
  });

  it('navigates to HomeScreen on successful login', () => {
    const replaceMock = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: replaceMock });

    const { getByPlaceholderText, getByTestId } = render(<AuthScreen />);
    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');
    fireEvent.press(getByTestId('login-button'));

    expect(replaceMock).toHaveBeenCalledWith('/HomeScreen');
  });
});

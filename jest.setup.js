// jest.setup.js
import '@testing-library/jest-native/extend-expect';

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0];
  if (
    typeof msg === 'string' &&
    msg.includes('SafeAreaView has been deprecated')
  ) {
    return;
  }
  originalWarn(...args);
};

const originalLog = console.log;
console.log = (...args) => {
  const msg = args[0];
  if (typeof msg === 'string' && msg.includes('No user found in storage')) {
    return;
  }
  originalLog(...args);
};

const originalError = console.error;
console.error = (...args) => {
  const msg = args[0];

  // Swallow React "not wrapped in act(...)" warnings
  if (typeof msg === 'string' && msg.includes('not wrapped in act')) {
    return;
  }

  // Swallow the *expected* "Network error" from CheckInScreen error test
  if (
    (msg instanceof Error && msg.message === 'Network error') ||
    (typeof msg === 'string' && msg.includes('Network error'))
  ) {
    return;
  }

  originalError(...args);
};

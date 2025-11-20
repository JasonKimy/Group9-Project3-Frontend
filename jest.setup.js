// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Ensure alert(...) exists in tests
if (typeof global.alert !== 'function') {
  global.alert = jest.fn();
}

// (Optional) silence the SafeArea deprecation noise
let warnSpy;
beforeAll(() => {
  const origWarn = console.warn.bind(console);
  warnSpy = jest.spyOn(console, 'warn').mockImplementation((msg, ...rest) => {
    if (typeof msg === 'string' && msg.includes('SafeAreaView has been deprecated')) return;
    origWarn(msg, ...rest);
  });
});

afterAll(() => {
  if (warnSpy && typeof warnSpy.mockRestore === 'function') {
    warnSpy.mockRestore();
  }
});

// --- Polyfill window.dispatchEvent for react-test-renderer DEV path
if (typeof global.window === 'undefined') {
    global.window = {};
  }
  if (typeof global.window.dispatchEvent !== 'function') {
    global.window.dispatchEvent = () => {};
  }
  

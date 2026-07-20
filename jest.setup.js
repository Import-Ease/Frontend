// Jest setup: mock AsyncStorage for non-React-Native test environments
// Only applies when running in Node test environment (not a real RN runtime)
try {
  const AsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
  jest.mock('@react-native-async-storage/async-storage', () => AsyncStorage);
} catch {
  // Module not installed on this branch — that's fine
}

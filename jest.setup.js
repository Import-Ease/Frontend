try {
  require.resolve('@react-native-async-storage/async-storage');
  const store = {};

  const AsyncStorageMock = {
    getItem: jest.fn(async (key) => store[key] ?? null),
    setItem: jest.fn(async (key, value) => { store[key] = value; }),
    removeItem: jest.fn(async (key) => { delete store[key]; }),
    multiGet: jest.fn(async (keys) => keys.map((k) => [k, store[k] ?? null])),
    multiSet: jest.fn(async (pairs) => { pairs.forEach(([k, v]) => { store[k] = v; }); }),
    multiRemove: jest.fn(async (keys) => { keys.forEach((k) => { delete store[k]; }); }),
    clear: jest.fn(async () => { Object.keys(store).forEach((k) => delete store[k]); }),
    getAllKeys: jest.fn(async () => Object.keys(store)),
    __store: store,
  };

  jest.mock('@react-native-async-storage/async-storage', () => AsyncStorageMock);
} catch {
  // Module not installed on this branch — skip mock
}

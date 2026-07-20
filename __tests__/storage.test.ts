import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadAuthState, saveAuthState, saveAdminToken, clearAuthState } from '../src/services/storage';

const store = (AsyncStorage as any).__store as Record<string, string>;

beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  (globalThis as any).__IMPORT_EASE_TOKEN__ = undefined;
  (globalThis as any).__IMPORT_EASE_USERNAME__ = undefined;
  (globalThis as any).__IMPORT_EASE_EMAIL__ = undefined;
  (globalThis as any).__IMPORT_EASE_ROLE__ = undefined;
  (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ = undefined;
  jest.clearAllMocks();
});

describe('saveAuthState', () => {
  it('persists token, username, and role to AsyncStorage', async () => {
    await saveAuthState({
      token: 'test-token-123',
      username: 'testuser',
      role: 'IMPORTER',
    });

    const stored = await AsyncStorage.multiGet([
      '@importease_token',
      '@importease_username',
      '@importease_role',
    ]);
    const map = Object.fromEntries(stored);

    expect(map['@importease_token']).toBe('test-token-123');
    expect(map['@importease_username']).toBe('testuser');
    expect(map['@importease_role']).toBe('IMPORTER');
  });

  it('sets globalThis values matching stored data', async () => {
    await saveAuthState({
      token: 'tok',
      username: 'user',
      email: 'user@test.com',
      role: 'SUPPLIER',
    });

    expect((globalThis as any).__IMPORT_EASE_TOKEN__).toBe('tok');
    expect((globalThis as any).__IMPORT_EASE_USERNAME__).toBe('user');
    expect((globalThis as any).__IMPORT_EASE_EMAIL__).toBe('user@test.com');
    expect((globalThis as any).__IMPORT_EASE_ROLE__).toBe('SUPPLIER');
  });

  it('does not overwrite unrelated keys when saving partial data', async () => {
    await saveAuthState({ token: 'tok1', username: 'user1', role: 'IMPORTER' });
    await saveAuthState({ token: 'tok2' });

    const stored = await AsyncStorage.multiGet([
      '@importease_token',
      '@importease_username',
      '@importease_role',
    ]);
    const map = Object.fromEntries(stored);

    expect(map['@importease_token']).toBe('tok2');
    expect(map['@importease_username']).toBe('user1');
    expect(map['@importease_role']).toBe('IMPORTER');
  });
});

describe('saveAdminToken', () => {
  it('persists admin token to AsyncStorage', async () => {
    await saveAdminToken('admin-token-xyz');

    const stored = await AsyncStorage.getItem('@importease_admin_token');
    expect(stored).toBe('admin-token-xyz');
  });

  it('sets globalThis admin token', async () => {
    await saveAdminToken('admin-token-xyz');
    expect((globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__).toBe('admin-token-xyz');
  });
});

describe('loadAuthState', () => {
  it('restores globalThis from AsyncStorage', async () => {
    await AsyncStorage.multiSet([
      ['@importease_token', 'saved-token'],
      ['@importease_username', 'saved-user'],
      ['@importease_email', 'saved@email.com'],
      ['@importease_role', 'SUPPLIER'],
      ['@importease_admin_token', 'saved-admin'],
    ]);

    await loadAuthState();

    expect((globalThis as any).__IMPORT_EASE_TOKEN__).toBe('saved-token');
    expect((globalThis as any).__IMPORT_EASE_USERNAME__).toBe('saved-user');
    expect((globalThis as any).__IMPORT_EASE_EMAIL__).toBe('saved@email.com');
    expect((globalThis as any).__IMPORT_EASE_ROLE__).toBe('SUPPLIER');
    expect((globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__).toBe('saved-admin');
  });

  it('does not set globalThis when AsyncStorage is empty', async () => {
    await loadAuthState();

    expect((globalThis as any).__IMPORT_EASE_TOKEN__).toBeUndefined();
    expect((globalThis as any).__IMPORT_EASE_USERNAME__).toBeUndefined();
    expect((globalThis as any).__IMPORT_EASE_EMAIL__).toBeUndefined();
    expect((globalThis as any).__IMPORT_EASE_ROLE__).toBeUndefined();
    expect((globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__).toBeUndefined();
  });

  it('handles partial data gracefully', async () => {
    await AsyncStorage.setItem('@importease_token', 'partial-token');

    await loadAuthState();

    expect((globalThis as any).__IMPORT_EASE_TOKEN__).toBe('partial-token');
    expect((globalThis as any).__IMPORT_EASE_USERNAME__).toBeUndefined();
  });
});

describe('clearAuthState', () => {
  it('removes all auth keys from AsyncStorage', async () => {
    await AsyncStorage.multiSet([
      ['@importease_token', 'tok'],
      ['@importease_username', 'user'],
      ['@importease_email', 'email'],
      ['@importease_role', 'role'],
      ['@importease_admin_token', 'admin'],
    ]);

    await clearAuthState();

    const stored = await AsyncStorage.multiGet([
      '@importease_token',
      '@importease_username',
      '@importease_email',
      '@importease_role',
      '@importease_admin_token',
    ]);
    const map = Object.fromEntries(stored);

    expect(map['@importease_token']).toBeNull();
    expect(map['@importease_username']).toBeNull();
    expect(map['@importease_email']).toBeNull();
    expect(map['@importease_role']).toBeNull();
    expect(map['@importease_admin_token']).toBeNull();
  });

  it('resets all globalThis values to undefined', async () => {
    (globalThis as any).__IMPORT_EASE_TOKEN__ = 'tok';
    (globalThis as any).__IMPORT_EASE_USERNAME__ = 'user';
    (globalThis as any).__IMPORT_EASE_EMAIL__ = 'email';
    (globalThis as any).__IMPORT_EASE_ROLE__ = 'role';
    (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ = 'admin';

    await clearAuthState();

    expect((globalThis as any).__IMPORT_EASE_TOKEN__).toBeUndefined();
    expect((globalThis as any).__IMPORT_EASE_USERNAME__).toBeUndefined();
    expect((globalThis as any).__IMPORT_EASE_EMAIL__).toBeUndefined();
    expect((globalThis as any).__IMPORT_EASE_ROLE__).toBeUndefined();
    expect((globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__).toBeUndefined();
  });

  it('completes full round-trip: save → load → clear → load', async () => {
    await saveAuthState({ token: 'tok', username: 'user', role: 'IMPORTER' });
    await loadAuthState();
    expect((globalThis as any).__IMPORT_EASE_TOKEN__).toBe('tok');

    await clearAuthState();
    await loadAuthState();
    expect((globalThis as any).__IMPORT_EASE_TOKEN__).toBeUndefined();
  });
});

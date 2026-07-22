import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@importease_token',
  USERNAME: '@importease_username',
  EMAIL: '@importease_email',
  ROLE: '@importease_role',
  ADMIN_TOKEN: '@importease_admin_token',
} as const;

export async function loadAuthState(): Promise<void> {
  const pairs = await AsyncStorage.multiGet([
    KEYS.TOKEN,
    KEYS.USERNAME,
    KEYS.EMAIL,
    KEYS.ROLE,
    KEYS.ADMIN_TOKEN,
  ]);
  const map = Object.fromEntries(pairs);
  if (map[KEYS.TOKEN]) (globalThis as any).__IMPORT_EASE_TOKEN__ = map[KEYS.TOKEN];
  if (map[KEYS.USERNAME]) (globalThis as any).__IMPORT_EASE_USERNAME__ = map[KEYS.USERNAME];
  if (map[KEYS.EMAIL]) (globalThis as any).__IMPORT_EASE_EMAIL__ = map[KEYS.EMAIL];
  if (map[KEYS.ROLE]) (globalThis as any).__IMPORT_EASE_ROLE__ = map[KEYS.ROLE];
  if (map[KEYS.ADMIN_TOKEN]) (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ = map[KEYS.ADMIN_TOKEN];
}

export async function saveAuthState(data: {
  token?: string;
  username?: string;
  email?: string;
  role?: string;
}): Promise<void> {
  const pairs: [string, string][] = [];
  if (data.token !== undefined) {
    pairs.push([KEYS.TOKEN, data.token]);
    (globalThis as any).__IMPORT_EASE_TOKEN__ = data.token;
  }
  if (data.username !== undefined) {
    pairs.push([KEYS.USERNAME, data.username]);
    (globalThis as any).__IMPORT_EASE_USERNAME__ = data.username;
  }
  if (data.email !== undefined) {
    pairs.push([KEYS.EMAIL, data.email]);
    (globalThis as any).__IMPORT_EASE_EMAIL__ = data.email;
  }
  if (data.role !== undefined) {
    pairs.push([KEYS.ROLE, data.role]);
    (globalThis as any).__IMPORT_EASE_ROLE__ = data.role;
  }
  if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
}

export async function saveAdminToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ADMIN_TOKEN, token);
  (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ = token;
}

export async function getAdminToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ADMIN_TOKEN);
}

export async function clearAuthState(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
  (globalThis as any).__IMPORT_EASE_TOKEN__ = undefined;
  (globalThis as any).__IMPORT_EASE_USERNAME__ = undefined;
  (globalThis as any).__IMPORT_EASE_EMAIL__ = undefined;
  (globalThis as any).__IMPORT_EASE_ROLE__ = undefined;
  (globalThis as any).__IMPORT_EASE_ADMIN_TOKEN__ = undefined;
}

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TOKEN: '@importease_token',
  USERNAME: '@importease_username',
  EMAIL: '@importease_email',
  ROLE: '@importease_role',
  ADMIN_TOKEN: '@importease_admin_token',
  ACCOUNTS: '@importease_accounts',
} as const;

export interface StoredAccount {
  token: string;
  username?: string;
  email?: string;
  role?: string;
}

const MAX_ACCOUNTS = 2;

function setGlobalSession(data: Partial<Record<'token' | 'username' | 'email' | 'role' | 'adminToken', string | undefined>>) {
  const g = globalThis as any;
  if ('token' in data) g.__IMPORT_EASE_TOKEN__ = data.token;
  if ('username' in data) g.__IMPORT_EASE_USERNAME__ = data.username;
  if ('email' in data) g.__IMPORT_EASE_EMAIL__ = data.email;
  if ('role' in data) g.__IMPORT_EASE_ROLE__ = data.role;
  if ('adminToken' in data) g.__IMPORT_EASE_ADMIN_TOKEN__ = data.adminToken;
}

async function readAccounts(): Promise<StoredAccount[]> {
  const raw = await AsyncStorage.getItem(KEYS.ACCOUNTS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAccounts(accounts: StoredAccount[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(accounts));
}

export async function loadAuthState(): Promise<void> {
  const pairs = await AsyncStorage.multiGet([
    KEYS.TOKEN,
    KEYS.USERNAME,
    KEYS.EMAIL,
    KEYS.ROLE,
    KEYS.ADMIN_TOKEN,
  ]);
  const map = Object.fromEntries(pairs);
  setGlobalSession({
    token: map[KEYS.TOKEN] || undefined,
    username: map[KEYS.USERNAME] || undefined,
    email: map[KEYS.EMAIL] || undefined,
    role: map[KEYS.ROLE] || undefined,
    adminToken: map[KEYS.ADMIN_TOKEN] || undefined,
  });
  if (!map[KEYS.ACCOUNTS]) {
    // Back-fill account list from the single stored session (v1 -> v2 migration)
    if (map[KEYS.TOKEN]) {
      const t = map[KEYS.TOKEN] as string;
      await writeAccounts([{
        token: t,
        username: map[KEYS.USERNAME] || undefined,
        email: map[KEYS.EMAIL] || undefined,
        role: map[KEYS.ROLE] || undefined,
      }]);
    }
  }
}

export async function saveAuthState(data: {
  token?: string;
  username?: string;
  email?: string;
  role?: string;
}): Promise<void> {
  setGlobalSession(data);

  const pairs: [string, string][] = [];
  if (data.token !== undefined) pairs.push([KEYS.TOKEN, data.token]);
  if (data.username !== undefined) pairs.push([KEYS.USERNAME, data.username]);
  if (data.email !== undefined) pairs.push([KEYS.EMAIL, data.email]);
  if (data.role !== undefined) pairs.push([KEYS.ROLE, data.role]);
  if (pairs.length > 0) await AsyncStorage.multiSet(pairs);

  await addAccountForCurrent(data);
}

/** Persist the currently logged-in session into the account list (max 2, no duplicates). */
async function addAccountForCurrent(data: {
  token?: string;
  username?: string;
  email?: string;
  role?: string;
}): Promise<void> {
  const token = data.token;
  if (!token) return;
  const acc: StoredAccount = {
    token,
    username: data.username || undefined,
    email: data.email || undefined,
    role: data.role || undefined,
  };
  const accounts = await readAccounts();
  const key = acc.email || acc.username || acc.token;
  const without = accounts.filter((a) => (a.email || a.username || a.token) !== key);
  const next = [acc, ...without].slice(0, MAX_ACCOUNTS);
  await writeAccounts(next);
}

export async function getSavedAccounts(): Promise<StoredAccount[]> {
  return readAccounts();
}

/** Switch to a saved account without re-entering credentials. */
export async function switchAccount(account: StoredAccount): Promise<void> {
  setGlobalSession({ token: account.token, username: account.username, email: account.email, role: account.role });
  await AsyncStorage.multiSet([
    [KEYS.TOKEN, account.token ?? ''],
    [KEYS.USERNAME, account.username ?? ''],
    [KEYS.EMAIL, account.email ?? ''],
    [KEYS.ROLE, account.role ?? ''],
  ]);
  await writeAccounts([account, ...(await readAccounts()).filter((a) => a.token !== account.token)].slice(0, MAX_ACCOUNTS));
}

/** Remove a saved account from the list (optionally also clear it if it is the active one). */
export async function removeSavedAccount(account: StoredAccount): Promise<void> {
  const accounts = await readAccounts();
  await writeAccounts(accounts.filter((a) => a.token !== account.token));
}

/**
 * Log out: clear the active session but keep ALL saved accounts so the user can
 * switch back later. Only "Remove Account" deletes a saved account.
 */
export async function logoutCurrent(_account?: StoredAccount): Promise<void> {
  await AsyncStorage.multiRemove([KEYS.TOKEN, KEYS.USERNAME, KEYS.EMAIL, KEYS.ROLE]);
  setGlobalSession({ token: undefined, username: undefined, email: undefined, role: undefined });
}

export async function saveAdminToken(token: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.ADMIN_TOKEN, token);
  setGlobalSession({ adminToken: token });
}

export async function getAdminToken(): Promise<string | null> {
  return AsyncStorage.getItem(KEYS.ADMIN_TOKEN);
}

export async function clearAuthState(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
  setGlobalSession({ token: undefined, username: undefined, email: undefined, role: undefined, adminToken: undefined });
}
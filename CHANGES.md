# Change Log

## Branch: fix/silent-errors

### Problem
5 screens silently swallowed API errors, showing empty UI with no feedback. Users could not distinguish "no data" from "backend unreachable".

### Fix
Added `Alert.alert()` error feedback to all silent catch blocks. Users now see an error message when backend requests fail.

### Files Changed
- `src/screens/AlertsScreen.tsx` — Added `Alert` import; replaced silent catch with alert
- `src/screens/CostCalculatorScreen.tsx` — Added `Alert` import; replaced silent catch with alert
- `src/screens/MyProductsScreen.tsx` — Added alert to product list load failure (tier info catch left as-is, it's supplementary)
- `src/screens/SearchProductsScreen.tsx` — Added `Alert` import; replaced silent catch with alert
- `src/screens/SettingsScreen.tsx` — Replaced silent catch with alert

### Not Changed (intentional)
- `DashboardScreen.tsx` — Main `fetchShipments` already had `Alert.alert()` error handling. The `.catch(() => null)` on `fetchTotalCost` is for supplementary data only.

---

## Branch: fix/token-persistence

### Problem
Auth state (token, username, email, role) stored only in `globalThis` — lost on every app restart. Users had to re-login every time the app was killed or backgrounded.

### Fix
Added AsyncStorage persistence layer. Auth state is now saved to device storage on login/signup and cleared on logout/delete. On app startup, stored auth state is restored before rendering.

### Architecture
- `src/services/storage.ts` — New utility module wrapping AsyncStorage
  - `loadAuthState()` — restores globalThis from AsyncStorage
  - `saveAuthState()` — persists to AsyncStorage + sets globalThis
  - `saveAdminToken()` — persists admin token
  - `clearAuthState()` — removes all stored auth data
- globalThis is kept as the in-memory cache so all existing reads across the app continue working unchanged

### Files Changed
- `src/services/storage.ts` — New file (AsyncStorage wrapper)
- `App.tsx` — Calls `loadAuthState()` on startup before rendering
- `src/screens/LoginScreen.tsx` — Calls `saveAuthState()` on login and signup
- `src/screens/AdminLoginScreen.tsx` — Calls `saveAdminToken()` on admin login
- `src/screens/SettingsScreen.tsx` — Calls `clearAuthState()` on logout and account deletion

### New Dependency
- `@react-native-async-storage/async-storage` — Installed via `npx expo install`

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

---

## Branch: feat/otp-email-verification

### Problem
The registration email-OTP verification workflow had been partially removed. The backend still shipped `OtpService`, `SmsService.sendOtpEmail()` (SendGrid), and the `VerifyOtpRequest` DTO, but there were no `verify-otp` / `resend-otp` endpoints and no `emailVerified` flag, so new registrations were not verified. The frontend had no `VerifyOtpScreen`, no route, and no `verifyOtp` / `resendOtp` API calls. Multi-account support was also incomplete, and the Alerts screen still carried a static "How alerts work" panel.

### Fix
Restored the full flow: register → SendGrid OTP → 6-digit verify screen → resend (60s throttle) → login blocked until verified.

### Backend (Spring Boot)
- `service/OtpService.java` — Rewritten: `SecureRandom` 6-digit codes, stored SHA-256 hashed (never plaintext), 5-minute expiry, 60-second resend cooldown, exactly one active OTP per identifier (resend overwrites).
- `controller/AuthController.java` — New endpoints:
  - `POST /api/auth/verify-otp` — `{identifier, otpCode}`; marks the user `emailVerified=true` on success, consumes the code on every attempt.
  - `POST /api/auth/resend-otp` — `{email}`; enforces the 60s cooldown, rejected for already-verified or unknown users.
  - `POST /api/auth/register` — real emails now get `requiresVerification:true` and no token; synthetic `*@importease.local` phone signups stay token-issued and skip verification.
  - `POST /api/auth/login` — returns `403 "Email not verified. Please verify your email first."` when `emailVerified == false`.
- `model/AppUser.java` — Added `@Column(name = "email_verified") Boolean emailVerified` (default `false`); exposed in JSON (only password stays `@JsonIgnore`).
- `config/DataSeeder.java` — Seeded accounts always set `emailVerified=true` (login gate uses `Boolean.FALSE.equals()`, so pre-existing NULL rows still log in — no data migration required).
- `exceptions/GlobalExceptionHandler.java` — Missing request parameters and type-mismatch parameters now return 400 instead of 500.

### Frontend (Expo / React Navigation v7)
- `src/screens/VerifyOtpScreen.tsx` — New screen: 6-digit code entry, Verify button, live 60s `m:ss` resend countdown, Resend button, Back-to-Login, friendly wrong/expired/network error handling, inputs disabled while verifying.
- `src/services/api.ts` — Added `verifyOtp(email, code)` and `resendOtp(email)`.
- `src/types/index.ts` — `RootStackParamList` gained `VerifyOtp: { email: string }` (between `Login` and `Main`).
- `App.tsx` — Registered the `VerifyOtp` stack screen.
- `src/screens/LoginScreen.tsx` — On register, routes to `VerifyOtp` when `requiresVerification`; add-account mode routes to `Main` via reset and shows a Cancel button.
- `src/services/storage.ts` — `logoutCurrent()` now only clears the active session (token/username/email/role) and keeps saved accounts; only `removeSavedAccount()` deletes one.
- `src/screens/SettingsScreen.tsx` — Accounts section: "Current Account" + "Saved Accounts" with per-account Switch / Remove actions and a "+ Add Account" pill (max 2, disabled with a message at the limit).
- `src/screens/AlertsScreen.tsx` — Removed the "How alerts work" engine panel; empty state now reads "No alerts available."

### Security design notes
- OTPs stored hashed (SHA-256) in-memory — no plaintext codes at rest, no DB entity.
- 5-minute expiry, 60-second resend throttle, one-time use (consumed on every verify attempt).
- No dev-only OTP echo endpoint was added — the full flow is validated by an integration test that captures the code at the `SmsService.sendOtpEmail()` seam, so no plaintext is ever exposed by the app and no SendGrid emails are burned during tests.

### Tests
- Backend: `controller/EmailVerificationFlowTest.java` (7 tests) — register-requires-verification, login blocked, correct-code verify, wrong-code rejected & consumed, resend throttled + fresh code works, new code invalidates old, expired code rejected, resend rejected post-verify/unknown, synthetic local signup bypasses. Full suite: all green (`mvnw.cmd test`).
- Frontend: `npx tsc --noEmit` clean; `npx jest` — 43 tests pass (storage/logout semantics unchanged for existing tests).

### Migration
None required — `email_verified` is a nullable column added by Hibernate `ddl-auto=update`; existing users have NULL which the login gate treats as "verified".

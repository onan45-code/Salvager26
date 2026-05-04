# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — start the Expo dev server (Metro). Then press `i` for iOS sim, `a` for Android, or scan the QR code with Expo Go.
- `npm run ios` / `npm run android` / `npm run web` — start with a specific target.

There is no test runner, linter, or type-checker configured. Verify changes by running the app — code is JavaScript (not TypeScript), so syntax errors only surface at Metro bundle time or runtime.

## Architecture

This is an Expo (SDK 54) / React Native app for a peer-to-peer car-bidding marketplace. The whole app is essentially **one file**: `App.js` (~1400 lines) contains every screen, the navigator, all helpers, and the StyleSheet. There is no `src/` directory and no per-screen files. When making changes, edit `App.js` in place rather than splitting things out unless the user asks for a refactor.

### Entry points
- `index.js` → `registerRootComponent(App)` (Expo boilerplate, don't touch).
- `App.js` default export wires a `@react-navigation/stack` navigator. `auth.onAuthStateChanged` decides whether `initialRoute` is `Welcome` or `Dashboard`.

### Screens (all inside App.js)
`Welcome` → `Login` (login/signup, same component, `route.params.mode`) → `Dashboard` → branches into `MyListings`, `BrowseCars`, `SellerBids`, `PlaceBid`, `CreateListing`, `Profile`, `EditListing`, `MyBid`, `MyBids`. Each screen is a top-level function component; navigation is via `navigation.navigate("ScreenName", params)`.

### Backend: Firebase (project `salvager26`)
`firebase.js` exports `auth`, `db` (Firestore), `storage`. The Firebase config is **hardcoded and committed** — this is intentional for a client-only app; do not move it to env vars without asking. Auth uses `initializeAuth` with AsyncStorage persistence (wrapped in try/catch because `initializeAuth` throws on hot-reload re-init — fall back to `getAuth`).

Three Firestore collections:
- `users` — `{ uid, email, firstName, lastName, phone, zipCode, companyName, pushToken, createdAt }`. Looked up by `where("uid", "==", ...)` rather than by document id.
- `listings` — vehicle posts. Status field is `"active" | "sold" | "deleted"` (soft-delete; never `deleteDoc`). Sold listings carry `soldPrice` and `soldToEmail`. Photos are an array of Firebase Storage URLs uploaded under `listings/{uid}/{timestamp}_{rand}`.
- `bids` — `{ listingId, buyerId, buyerEmail, amount, towingIncluded, note, status: "pending" | "accepted", createdAt }`. Buyer email is intentionally hidden from the seller until they accept the bid.

Sorting/filtering happens **client-side** after `getDocs` — there are no Firestore indexes or composite queries. Listings on `BrowseCars` are filtered to exclude `sellerId === currentUser.uid` and `status === "sold"` in JS.

### Push notifications
Uses the Expo Push API directly (`fetch("https://exp.host/--/api/v2/push/send", ...)`) — no server. Each user's `pushToken` is written to their `users` doc on login/signup. Two notification triggers exist: bid placed (notifies seller) and bid accepted (notifies buyer). Failures are silently swallowed (`try/catch` with empty body) so a missing token never breaks the main flow. The Expo project ID `aa722540-034a-4737-9e73-1efc9e4dd59c` is referenced both in `app.json` and in `registerForPushNotifications`.

### Geolocation / radius filtering (BrowseCars)
- ZIP → lat/lon via `https://api.zippopotam.us/us/{zip}` (free, no key).
- Distance via `geolib`'s `getDistance`, converted from meters to miles (`/1609.34`).
- Auto-detect button uses `expo-location` → `reverseGeocodeAsync` to get the user's ZIP, then re-runs the filter. The `applyFilter` function takes a `zipOverride` argument because `setZipCode` is async and won't be readable in the same tick — pass the freshly-detected ZIP through directly.

### Brand / naming gotcha
The npm package, repo, and `app.json` slug are all `CashForCars`, but the **UI brand displayed to users is "Salvager"** (see the logo Text on Dashboard and the Firebase project id). Don't "fix" one to match the other without asking — they're intentionally distinct.

### Style conventions to match when editing
- Inline styles for one-offs, `styles.xxx` for anything reused. The big `StyleSheet.create` block is at the bottom of `App.js`.
- Color palette: red `#c0392b` (primary CTAs, "seller" actions), navy `#1a3a6b` (secondary, "dealer/buyer" actions), green `#2ecc71` (success/accepted), light bg `#f5f5f5`.
- All async handlers wrap user-facing errors in `Alert.alert("Error", error.message)`. Loading state is a local `useState` boolean toggled around the `try/finally`-style flow.
- Data refresh on screen focus uses `navigation.addListener("focus", fetchFn)` inside `useEffect` and returns the unsubscribe — match this pattern instead of refetching on mount only.

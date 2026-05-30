# Salvager26 — Claude Code Project Context

## Session Start

**At the beginning of every new session, greet the user with:**
> "Hey Marc! How are you today? What are we working on with Salvager?"

Then wait for Marc to describe what he needs. Do not list options or ask clarifying questions upfront — just wait.

**User profile and task guide:** See `config_marc.md` in this folder. Load it at the start of every session to understand who Marc is, his app identifiers, and how to walk him through common tasks (iOS submit, Android submit, API key generation, builds).

---

## What this app does
Salvager26 is a **car salvage marketplace** built for auto dealers and private sellers.
Users can list salvage vehicles, browse listings by location/zip, place bids, and manage their account.
The app uses Firebase for all data and storage, and is built in JavaScript (React Native / Expo).

---

## Tech Stack
- **Frontend:** JavaScript — App.js (main), index.js (entry point)
- **Backend/DB:** Firebase Firestore (NoSQL database)
- **File Storage:** Firebase Storage (vehicle photos)
- **Auth:** Firebase Authentication
- **Config:** firebase.js — all Firebase initialization lives here

---

## Key Files
| File | Purpose |
|------|---------|
| `App.js` | Main application logic — screens, navigation, listing logic (~1400 lines, single file) |
| `firebase.js` | Firebase config, Firestore + Storage initialization |
| `index.js` | App entry point (Expo boilerplate, don't touch) |
| `app.json` | Expo configuration |
| `assets/` | Logo and UI assets |

---

## Architecture Notes
- **Single file app:** All screens, navigator, helpers, and StyleSheet live in `App.js`. Do not split into separate files unless Marc asks.
- **Navigation:** `@react-navigation/stack`. Auth state (`auth.onAuthStateChanged`) decides `initialRoute` — `Welcome` or `Dashboard`.
- **Screens:** `Welcome` → `Login` → `Dashboard` → `MyListings`, `BrowseCars`, `SellerBids`, `PlaceBid`, `CreateListing`, `Profile`, `EditListing`, `MyBid`, `MyBids`
- **Brand gotcha:** npm package and repo are `CashForCars`, UI brand is `Salvager`. Do NOT fix one to match the other without asking.
- **Sorting/filtering:** All client-side after `getDocs` — no Firestore indexes or composite queries.

---

## Firestore Database Schema

### Collection: `listings`
| Field | Type | Description |
|-------|------|-------------|
| `make` | string | Vehicle make (e.g. "Kia") |
| `model` | string | Vehicle model (e.g. "Sportage") |
| `year` | string | Model year |
| `trim` | string | Trim level |
| `mileage` | string | Odometer reading |
| `city` | string | Location city |
| `zip` | string | ZIP code for radius search |
| `status` | string | "active" / "sold" / "deleted" (soft-delete only, never deleteDoc) |
| `hasKeys` | boolean | Whether vehicle has keys |
| `hasTitle` | boolean | Whether title is available |
| `runs` | boolean | Whether vehicle runs |
| `needsTow` | boolean | Whether tow is needed |
| `notes` | string | Seller notes |
| `photos` | array | Firebase Storage URLs |
| `sellerId` | string | UID of seller |
| `sellerEmail` | string | Seller email |
| `soldPrice` | number | Set when status → "sold" |
| `soldToEmail` | string | Set when status → "sold" |
| `createdAt` | timestamp | Listing creation time |

### Collection: `bids`
| Field | Type | Description |
|-------|------|-------------|
| `amount` | number | Bid amount in USD |
| `listingId` | string | Reference to listings document |
| `buyerId` | string | UID of bidder |
| `buyerEmail` | string | Hidden from seller until accepted |
| `status` | string | "pending" / "accepted" |
| `towingIncluded` | boolean | Whether buyer handles towing |
| `note` | string | Buyer note |
| `createdAt` | timestamp | Bid creation time |

### Collection: `users`
Queried by `where("uid", "==", ...)` not by document id.
| Field | Type | Description |
|-------|------|-------------|
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `email` | string | User email |
| `phone` | string | Phone number |
| `companyName` | string | Dealer company name (optional) |
| `zipCode` | string | User ZIP for local search |
| `uid` | string | Firebase Auth UID |
| `pushToken` | string | Expo push notification token |
| `createdAt` | timestamp | Account creation time |

---

## Push Notifications
- Expo Push API directly — no server
- Triggers: bid placed (notifies seller) + bid accepted (notifies buyer)
- Failures silently swallowed — missing token never breaks main flow
- Expo project ID: `aa722540-034a-4737-9e73-1efc9e4dd59c`

## Geolocation / Radius Filtering
- ZIP → lat/lon via `https://api.zippopotam.us/us/{zip}` (free, no key)
- Distance via `geolib.getDistance`, converted meters → miles (`/1609.34`)
- Use `zipOverride` param in `applyFilter` — don't rely on async `setZipCode` state

## Style Conventions
- Colors: red `#c0392b` (seller/CTA), navy `#1a3a6b` (buyer), green `#2ecc71` (success), bg `#f5f5f5`
- Errors: always `Alert.alert("Error", error.message)`
- Screen refresh: `navigation.addListener("focus", fetchFn)` inside `useEffect`

---

## Claude Code Rules (Always Follow)

1. **Read `firebase.js` first** before any database or storage changes
2. **Keep existing function and variable names** — do not rename without asking
3. **Explain in plain English** — Marc is non-technical, avoid jargon
4. **One task at a time** — never rewrite multiple files in one go
5. **Never use `deleteDoc`** — listings use soft-delete (`status: "deleted"`)
6. **Never hardcode Firebase URLs** — always use Storage references
7. **Status values are lowercase strings** — "active"/"sold"/"deleted" for listings, "pending"/"accepted" for bids
8. **Commit to GitHub before ending every session**
9. **Focus on one file per session** — if context feels full, summarize and start new session

---

## Project Owner
- **Name:** Marc Zelinka (@redstate25 on Fiverr)
- **Company:** Carsmart Inc
- **Firebase project:** salvager26
- **GitHub:** github.com/onan45-code/Salvager26
- **OS:** macOS (Big Sur+)

---

*Last updated: May 5, 2026 — configured by Alex K (DevOps/AI consultant)*
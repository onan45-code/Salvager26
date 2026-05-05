# Salvager26 — Claude Code Project Context

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
| `App.js` | Main application logic — screens, navigation, listing logic |
| `firebase.js` | Firebase config, Firestore + Storage initialization |
| `index.js` | App entry point |
| `app.json` | Expo configuration |
| `assets/` | Logo and UI assets |

---

## Firestore Database Schema

### Collection: `listings`
Each document = one vehicle listing.
| Field | Type | Description |
|-------|------|-------------|
| `make` | string | Vehicle make (e.g. "Kia") |
| `model` | string | Vehicle model (e.g. "Sportage") |
| `year` | string | Model year (e.g. "2007") |
| `trim` | string | Trim level (e.g. "LX") |
| `mileage` | string | Odometer reading |
| `city` | string | Location city |
| `zip` | string | ZIP code for radius search |
| `status` | string | "active" / "sold" / "pending" |
| `hasKeys` | boolean | Whether vehicle has keys |
| `hasTitle` | boolean | Whether title is available |
| `runs` | boolean | Whether vehicle runs |
| `needsTow` | boolean | Whether tow is needed |
| `notes` | string | Seller notes |
| `photos` | array | Firebase Storage URLs |
| `sellerId` | string | UID of seller |
| `sellerEmail` | string | Seller email |
| `createdAt` | timestamp | Listing creation time |

### Collection: `bids`
Each document = one bid on a listing.
| Field | Type | Description |
|-------|------|-------------|
| `amount` | number | Bid amount in USD |
| `listingId` | string | Reference to listings document |
| `buyerId` | string | UID of bidder |
| `buyerEmail` | string | Bidder email |
| `status` | string | "pending" / "accepted" / "rejected" |
| `pickupIncluded` | boolean | Whether buyer handles pickup |
| `note` | string | Buyer note |
| `createdAt` | timestamp | Bid creation time |

### Collection: `users`
Each document = one registered user.
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

## Claude Code Rules (Read Before Every Task)

1. **Always read `firebase.js` first** before suggesting any database or storage changes
2. **Keep existing function and variable names** — do not rename without asking
3. **Explain changes in plain English** — Marc is non-technical, avoid jargon
4. **One task at a time** — don't rewrite multiple files in one go
5. **Check `listings` schema** before adding new fields — stay consistent with existing structure
6. **Photos are stored in Firebase Storage** — never hardcode URLs, always use Storage references
7. **Status fields use lowercase strings** — "active", "accepted", "pending" (not uppercase)

---

## Context Window Optimization
- Focus on one file per session to avoid context overload
- Start each session by reading this CLAUDE.md first
- If context feels full, summarize progress and start a new session
- Always commit to GitHub before ending a session

---

## Project Owner
- **Name:** Marc Zelinka (MarZeL on Fiverr)
- **Company:** Carsmart Inc
- **Firebase project:** salvager26
- **GitHub repo:** github.com/onan45-code/Salvager26
- **OS:** macOS (Big Sur+)

---

*Last updated: May 5, 2026 — configured by Alex K (DevOps/AI consultant)*
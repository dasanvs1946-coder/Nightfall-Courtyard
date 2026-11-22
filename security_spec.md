# Firestore Security Specification — Nightfall Courtyard v2.0.1

## 1. Data Invariants
1. **Identity & Ownership**: Each `/leaderboard/{playerId}` and `/daily_leaderboard/{dateKey}/entries/{playerId}` document ID must match `request.auth.uid`, match `data.uid`, and come from any signed-in Firebase Auth user (`request.auth != null`, including Firebase Anonymous Authentication).
2. **Strict Schema**:
   - `/leaderboard/{playerId}` allows only the 12 exact fields: `uid`, `callsign`, `wave`, `kills`, `score`, `mode`, `arena`, `skinId`, `platform`, `isPublic`, `createdAt`, `updatedAt`.
   - `/daily_leaderboard/{dateKey}/entries/{playerId}` allows only those 12 fields plus `dateKey` (`YYYY-MM-DD`) and `mutator`.
   - Zero PII (`email`, `phone`, `address`) is stored.
3. **Bounded Types & Patterns**:
   - `uid`: string length `1..128`, matching `^[a-zA-Z0-9_\-]+$`
   - `callsign`: string length `3..15`, matching `^[A-Za-z0-9 ]{3,15}$` and not whitespace-only (`!matches('^ +$')`)
   - `wave`: integer `1..200`
   - `kills`: integer `0..1000000`
   - `score`: integer `0..100000000`
   - `mode`: enum `['normal', 'storm', 'blackout', 'boss_rush', 'daily']` (`'daily'` on daily subcollection)
   - `arena`: enum `['courtyard', 'parking_deck', 'helipad']`
   - `skinId`: enum `['nightwatch', 'crimson_recon', 'hazmat_breacher', 'cyber_ronin', 'storm_phantom', 'golden_sovereign']`
   - `platform`: enum `['Web', 'APK']`
   - `isPublic`: `true`
4. **Monotonic Score & Immutable Creation**: Updates cannot decrease `score`, cannot mutate `uid`, `createdAt`, `dateKey`, or `isPublic`, allow updates only to expected mutable score/name keys, and must set `updatedAt == request.time`.
5. **Query Safety**: `allow list` enforces `existing().score >= 0` (matching single-field `.where('score', '>=', 0)` + `orderBy('score', 'desc')` + `limit(20)` queries without unrestricted blanket reads).

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Create**: Writing without `request.auth` -> Denied (`!isSignedIn()`).
2. **Whitespace-Only Callsign Spoof**: `{ callsign: "   " }` -> Denied (`matches('^ +$')`).
3. **Identity Spoofing (Doc ID Mismatch)**: Signed-in user `uidA` writing to `/leaderboard/uidB` -> Denied (`playerId != request.auth.uid`).
4. **Payload UID Spoofing**: Doc `/leaderboard/uidA` with `{ uid: "uidB", ... }` -> Denied (`data.uid != request.auth.uid`).
5. **Shadow / Ghost Field Injection**: Valid entry plus `{ isAdmin: true }` or `{ email: "leak@example.com" }` -> Denied (`hasOnly(...)`).
6. **Score / Wave Overflow Poisoning**: `{ score: 999999999999 }` or `{ wave: 250 }` or `{ score: "9999" }` -> Denied.
7. **Timestamp Forgery on Create**: `{ createdAt: Timestamp("2020-01-01") }` instead of `request.time` -> Denied.
8. **Score Downgrade on Update**: Existing `score: 5000`, update tries `{ score: 100 }` -> Denied (`incoming().score >= existing().score`).
9. **Immutable Field Mutation on Update**: Attempt to alter `createdAt`, `dateKey`, or `uid` -> Denied.
10. **Path Variable / ID Poisoning**: 1.5KB junk document ID or malformed `dateKey` -> Denied (`isValidId` / `isValidDateKey`).
11. **Oversized / XSS Callsign Injection**: `{ callsign: "<script>" }` -> Denied (`callsign.matches('^[A-Za-z0-9 ]{3,15}$')`).
12. **Default Catch-All Arbitrary Collection Write**: Writing to `/users/uidA` or `/admins/uidA` -> Denied by top-level catch-all `match /{document=**}`.

## 3. Native Android App Update Metadata (`/config/{configId}`)
1. **Single Document Get Only**: `allow get: if isValidId(configId) && configId == 'app'`.
2. **No Collection Listing & Zero Client Writes**: `allow list: if false` and `allow create, update, delete: if false`.


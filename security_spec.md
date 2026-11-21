# Firestore Security Specification — Nightfall Courtyard Global Leaderboard

## 1. Data Invariants
1. **Identity & Ownership**: Each `/leaderboard/{entryId}` document ID must match `request.auth.uid`, match `data.uid`, and come from an authenticated user with `request.auth.token.email_verified == true`.
2. **Strict Schema**: Only the exact 9 allowlisted fields (`uid`, `playerName`, `score`, `wave`, `kills`, `equippedGear`, `isPublic`, `createdAt`, `updatedAt`) may exist on create or update. No PII (`email`, `phone`, `address`) is ever stored.
3. **Bounded Types & Patterns**:
   - `uid`: string length `1..128`, matching `^[a-zA-Z0-9_\-]+$`
   - `playerName`: string length `1..24`, matching `^[a-zA-Z0-9 _\-\.]+$`
   - `score`: integer `0..100000000`
   - `wave`: integer `1..999`
   - `kills`: integer `0..1000000`
   - `equippedGear`: one of `['mine', 'turret', 'flashbang']`
   - `isPublic`: `true`
4. **Monotonic Score & Immutable Creation**: Updates cannot decrease `score`, cannot mutate `uid`, `createdAt`, or `isPublic`, and must set `updatedAt == request.time`.
5. **Query Safety**: `allow list` validates `resource.data.isPublic == true && resource.data.score is int` without any `get()`/`exists()` calls or unrestricted blanket reads.

## 2. The "Dirty Dozen" Attack Payloads (All Must Return PERMISSION_DENIED)
1. **Unauthenticated Create**: `{ uid: "anon", playerName: "Guest", score: 500, ... }` -> Denied (`!isVerifiedUser()`).
2. **Unverified Email Token**: `request.auth.token.email_verified = false` submitting valid payload -> Denied.
3. **Identity Spoofing (Doc ID Mismatch)**: Signed-in user `uidA` writing to `/leaderboard/uidB` -> Denied (`entryId != request.auth.uid`).
4. **Payload UID Spoofing**: Doc `/leaderboard/uidA` with `{ uid: "uidB", ... }` -> Denied (`data.uid != request.auth.uid`).
5. **Shadow / Ghost Field Injection**: Valid entry plus `{ isAdmin: true }` or `{ email: "leak@example.com" }` -> Denied (`hasOnly(...)`).
6. **Score Overflow Poisoning**: `{ score: 999999999999 }` or `{ score: -50 }` or `{ score: "9999" }` -> Denied.
7. **Timestamp Forgery on Create**: `{ createdAt: Timestamp("2020-01-01") }` instead of `request.time` -> Denied.
8. **Score Downgrade / Replay Tamper on Update**: Existing `score: 5000`, update tries `{ score: 100 }` -> Denied (`incoming().score >= existing().score`).
9. **Immutable Field Mutation on Update**: Attempt to alter `createdAt` or `uid` alongside a new high score -> Denied.
10. **Path Variable / ID Poisoning**: 1.5KB junk document ID `/leaderboard/aaaaa...` -> Denied (`isValidId(entryId)`).
11. **Oversized / XSS Callsign Injection**: `{ playerName: "<script>alert(1)</script>..." }` -> Denied (`playerName.matches(...)` and `.size() <= 24`).
12. **Default Catch-All Arbitrary Collection Write**: Writing to `/users/uidA` or `/admins/uidA` -> Denied by top-level catch-all `match /{document=**}`.

# Security Specification - NOX

## 1. Data Invariants
- A `User` document must be owned by the authenticated user (document ID == auth.uid).
- A `Post` document must have a `user_id` matching the authenticated user.
- `created_at` fields must be set using `request.time`.
- `likes_count`, `followers_count`, `following_count` should only be modifiable by system logic (for now, we'll allow restricted updates or handle them as Step 2).
- Users can only edit their own `username`, `bio`, `profile_pic`.

## 2. The "Dirty Dozen" Payloads (Denial Expected)
1. Creating a user profile with a different user's ID.
2. Updating someone else's bio.
3. Creating a post where `user_id` is not the sender's UID.
4. Updating a post's `image_url` after creation (posts are immutable except for metadata in some apps, but here we might want to restrict).
5. Setting `likes_count` to a massive number manually.
6. Spoofing `created_at` with a future date.
7. Injecting a 2MB string into `username`.
8. Updating someone else's `followers_count`.
9. Deleting a post owned by another user.
10. Listing users without being authenticated (if we want to restrict discovery).
11. Reading PII like email of other users (we should isolate PII).
12. Attempting to use a 200-character random string as a document ID.

## 3. Test Runner
We will implement `firestore.rules` and verify these via deployment.

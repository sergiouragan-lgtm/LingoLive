# Security Specification

## Data Invariants
1. A user cannot set their own role.
2. A subscription must belong to a valid user.
3. A user can only access their own profile.

## The Dirty Dozen Payloads
1. User setting role to 'Admin' on registration.
2. User creating subscription for another user.
3. User reading other users' subscriptions.
4. User modifying subscription status.
...

## Test Runner
(firestore.rules.test.ts content here)

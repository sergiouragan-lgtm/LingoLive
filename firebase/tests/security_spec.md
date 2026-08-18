# LingoLIVE IA - Enterprise Security Specification

This specification governs the automated security tests verifying the access rules integrity for all multi-tenant and corporate entities.

## 1. Core Data Invariants

1. **Strict Tenant Separation**: A user with `tenantId: company-a` must not be able to read or write assets belonging to `tenantId: company-b`.
2. **Prevent Role Escalation**: Registered students must not be able to update their role to `SUPER_ADMIN` or modify other identity values.
3. **Immutability of Ledgers**: Documents in the `auditLogs` and `payments` collection must never support updates or deletions.
4. **Children Safety & Guardian Isolation**: Parents must only read and write to student progress data associated with their own children's IDs.

## 2. The "Dirty Dozen" Malicious Payload Attack Vector Tests

Below are the 12 specific payloads built to attempt rules bypass. All must result in a strict `PERMISSION_DENIED` rejection.

| Payload ID | Targeted Collection | Attack Vector | Expected Result |
|------------|---------------------|---------------|-----------------|
| ATK-001    | `users`             | Setting own role to `SUPER_ADMIN` on signup | `PERMISSION_DENIED` |
| ATK-002    | `users`             | Modifying `email` property after validation | `PERMISSION_DENIED` |
| ATK-003    | `profiles`          | Overwriting a different user's bio profile | `PERMISSION_DENIED` |
| ATK-004    | `schools`           | Updating school `ownerUid` to steal tenancy | `PERMISSION_DENIED` |
| ATK-005    | `students`          | Escalating student `streakDays` to game rewards | `PERMISSION_DENIED` |
| ATK-006    | `payments`          | Attempting to update payment receipts (refund spoofing) | `PERMISSION_DENIED` |
| ATK-007    | `payments`          | Attempting to delete historic payment ledgers | `PERMISSION_DENIED` |
| ATK-008    | `courses`           | Modifying course CEFR difficulty rating from student account | `PERMISSION_DENIED` |
| ATK-009    | `auditLogs`         | Attempting to update historical event parameters | `PERMISSION_DENIED` |
| ATK-010    | `aiSessions`        | Accessing session logs of another company employee | `PERMISSION_DENIED` |
| ATK-011    | `featureFlags`      | Disabling licensing checks or enabling premium features | `PERMISSION_DENIED` |
| ATK-012    | `systemLogs`        | Modifying error messages or system trace codes | `PERMISSION_DENIED` |

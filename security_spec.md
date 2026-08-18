# ISO 27001 Security & Governance Specification: LingoLIVE Enterprise

This document defines the zero-trust security architecture, data invariants, and verification criteria for the LingoLIVE PWA platform as required by ISO 27001 compliance standards.

---

## 1. Zero-Trust Data Invariants (Attribute-Based Access Control)

To ensure maximum security and alignment with the ISO/IEC 27001 Annex A.9 (Access Control) controls, the LingoLIVE platform enforces the following strict data invariants directly at the database engine level (Firestore):

### A. Subject/User Attribute Attributes (ABAC)
- **Email Verification Mandate**: Any write (Create, Update, Delete) operation on non-anonymous resources requires the subject's email to be verified: `request.auth.token.email_verified == true`.
- **Verified Identities**: The author or owner identifier (e.g., `userId`, `teacherId`, `studentId`) of any document modified by a client must match the active subject: `request.auth.uid`.
- **Privilege/Role Safeguards**: Users are strictly forbidden from assigning or escalating their own roles. Global roles are looked up via the `/users/{userId}` source of truth or checked using custom claims.

### B. Object/Resource Attributes (PII Isolation & Tenancy)
- **Multi-Tenant Partitioning**: All tenant-specific resources (nested inside `/tenants/{tenantId}/...`) require the user to be an active, validated member of the tenant.
- **Personally Identifiable Information (PII) Protection**: Strict isolation of PII records. Read/write access is restricted exclusively to the record owner (`userId == request.auth.uid`) or authorized administrators. No generalized read/list permission is allowed on collections containing sensitive profiles, preferences, or payment info.
- **Structural Integrity (Denial-of-Wallet Guard)**: Every field is checked for data type, string length (preventing massive junk injection), and array limits. All custom document IDs are validated using `id.size() <= 128` and matching alphanumeric/hyphen characters.

### C. Environmental & State Attributes
- **Temporal Integrity**: All timestamp fields (`createdAt`, `updatedAt`) are matched against the system server time (`request.time`). Custom client values are rejected.
- **Terminal State Locking**: Once a processes or assessment reaches a completed or terminal status (e.g., `status == 'completed'`), the document is frozen. Subsequent updates are rejected unless requested by a Platform Administrator.
- **Immutability of Key Metadata**: Core relation fields (such as `tenantId`, `userId`, `paymentId`, `courseId`) cannot be altered post-creation.

---

## 2. The "Dirty Dozen" Threat Vector Payloads

Below are the 12 specific hostile payloads/operations designed to break LingoLIVE security parameters, which are systematically blocked by the `firestore.rules` engine:

1. **Identity Spoofing (Foreign Write)**: User `user_123` attempts to write progress data on `/progress/user_456` targeting another user.
2. **Privilege Escalation**: User `user_123` attempts to set their own global user roles list to `["admin", "SUPER_ADMIN"]` during registration or update.
3. **Multi-Tenant Violation (Data Spill)**: User authenticated under Tenant A (`tenant_aaa`) attempts to read classroom lists on `/tenants/tenant_bbb/classrooms/class_999` belonging to Tenant B.
4. **Denial-of-Wallet (DOW) String Overload**: An attacker attempts to inject a 10MB string into a `displayName` or `país` field to exhaust database resources and increase hosting costs.
5. **ID Poisoning Attack**: An attacker attempts to create a document with a 1.5KB junk ID (e.g., `/users/ABC...XYZ_junk_junk`) containing special regex characters or system escape symbols.
6. **Temporal Forgery**: A user attempts to create a document with a backdated `createdAt` timestamp (e.g., set to yesterday) to forge streaks or submission deadlines.
7. **Terminal State Bypass**: A student attempts to alter the answers or score of an already completed writing exam (`status == 'completed'`) or `live_classes` document.
8. **Immutability Bypass**: A user attempts to change the `tenantId` or `userId` attribute of an established document to associate it with a different account.
9. **Email Verification Bypass (Spoofing)**: A user with a newly registered unverified email address (`email_verified == false`) attempts to submit writing essays or schedule live tutoring sessions.
10. **Blanket Query Scraping**: A user attempts to perform a generalized query to list all payments across the entire platform without specifying their own user identity as a filter.
11. **PII Leakage Attempt**: An authenticated user attempts to execute a `get` request to view the private notification preferences or profile details of another student.
12. **System-Generated Field Injection**: A user attempts to write to a system-only field (e.g., injecting an AI-generated assessment report) from their client-side SDK.

---

## 3. The Test Runner Spec

The security specification is structurally validated. Standard verification tests are modeled as follows:

```typescript
// firestore.rules.test.ts (Validation Schema Representation)
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("LingoLIVE ISO 27001 Security Rule Enforcement Tests", () => {
  let testEnv: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "lingolive-enterprise-abac",
      firestore: { rules: require("fs").readFileSync("firestore.rules", "utf8") }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test("Threat Vector 1: Reject foreign profile write (Identity Spoofing)", async () => {
    const context = testEnv.authenticatedContext("user_123", { email_verified: true });
    const db = context.firestore();
    const docRef = db.doc("progress/user_456");
    await assertFails(docRef.set({ currentLevel: "A1", totalMinutesSpent: 45 }));
  });

  test("Threat Vector 2: Prevent self-assigned roles during profile update", async () => {
    const context = testEnv.authenticatedContext("user_123", { email_verified: true });
    const db = context.firestore();
    const docRef = db.doc("users/user_123");
    await assertFails(docRef.set({ email: "user@example.com", roles: ["SUPER_ADMIN"], tenantId: "tenant_abc" }));
  });

  test("Threat Vector 3: Prevent unverified emails from creating speaking sessions", async () => {
    const context = testEnv.authenticatedContext("user_123", { email_verified: false });
    const db = context.firestore();
    const docRef = db.doc("speaking_sessions/session_1");
    await assertFails(docRef.set({ userId: "user_123", topic: "Grammar Study" }));
  });
});
```

# LingoLIVE IA - Enterprise Firebase Architecture Manual

## 1. Executive Summary

This architecture manual governs the configuration, deployment, and operation of the LingoLIVE IA Enterprise cloud infrastructure. Designed to support millions of concurrent users globally, this architecture provides bulletproof **Zero-Trust Multi-Tenancy**, **Attribute-Based Access Control (ABAC)**, and secure integration for schools, companies, and content-moderators.

---

## 2. Infrastructure Design & Blueprint

The architecture is built entirely on Firebase Enterprise products integrated natively:

```
                      +-----------------------------+
                      |      Firebase Hosting       |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |    Firebase Authentication  |
                      |   (MFA, SSO, Magic Links)   |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |      Cloud Firestore        |
                      | (Multi-Tenant Isolation-ABAC)|
                      +-------+--------------+------+
                              |              |
         +--------------------+              +--------------------+
         v                                                        v
+------------------+                                     +------------------+
|  Cloud Storage   |                                     | Cloud Functions  |
| (AV Scan Hooks)  |                                     | (Vite & Stripe)  |
+------------------+                                     +------------------+
```

### Collection Schema (28 Nodes)
All collections strictly inherit the enterprise fields metadata:
- `createdAt`: ISO 8601 creation timeline.
- `updatedAt`: ISO 8601 state change timeline.
- `createdBy` / `updatedBy`: Tracking ID of actor (UID or SYSTEM).
- `tenantId`: Organization partition key.
- `status`: Lifecycle indicators (`ACTIVE`, `INACTIVE`, `PENDING`, `ARCHIVED`).
- `version`: Document revision counters supporting schema migrations.
- `softDelete`: Boolean filtering out active listings.

---

## 3. Zero-Trust Security & Multi-Tenancy

### 8 Pillars of the Absolute Fortress Rules
1. **Master Gate Enforcement**: Access to subcollections is programmatically evaluated against the parent record membership via the `get()` instruction.
2. **Schema Validation Blueprints**: The `isValid[Entity]` helpers validate strict payload field sizes and types prior to committing writes.
3. **ID Poisoning Protection**: Enforces `isValidId()` on document parameters to avoid character attacks.
4. **Tiered Identites (RBAC/ABAC)**: Writes are restricted into permission tiers using `affectedKeys().hasOnly()`.
5. **Array Boundary Limits**: Restricts recursive lists with strict size limitations.
6. **Personally Identifiable Information Isolation**: Personal user information is either split out or isolated under `isOwner()` or `isAdmin()` restrictions.
7. **existsAfter Atomic Guarantees**: Relational writes are validated to occur atomically in the same batch.
8. **Secure Query Enforcements**: List rules check `resource.data.userId == request.auth.uid` to prevent client-side filter spoofing.

---

## 4. Disaster Recovery & Incident Runbooks

### Runbook A: Resolving Malicious Data Infiltration (Data Poisoning)
**Scenario**: A compromised student account uploads a corrupted file or triggers bulk updates bypassing input logic.
1. **Quarantine the Tenant**:
   - Access the `featureFlags` collection or Remote Config and set `maintenanceMode: true` for the affected `tenantId`.
2. **Disable User Auth Sessions**:
   - Locate the offender’s UID via `users` collection. Update status to `TERMINATED` and disable login credentials inside the Firebase console.
3. **Execute Point-In-Time-Recovery (PITR)**:
   - Run the restoration tool in GCP Console:
     `gcloud firestore databases restore --source-backup=projects/lingolive/backups/daily-backup-id`

### Runbook B: Reclaiming Compromised Stripe Webhooks
**Scenario**: Rogue payloads attempt to spoof user payments.
1. **Rotate Webhook Secret**:
   - Access Google Cloud Secret Manager and update the secret `STRIPE_WEBHOOK_KEY` immediately.
2. **Restart Cloud Functions Engine**:
   - Re-deploy functions or flush server caches:
     `firebase deploy --only functions:handleStripeWebhook`

---

## 5. Developer & Deployment Guide

### Setting Up the Local Suite
Start the Local Emulator Suite to simulate full enterprise services:
```bash
firebase emulators:start --config firebase/emulators/firebase.json
```

### Compiling and Validating Changes
Ensure strict type evaluations and test sweeps compile:
```bash
# Verify TypeScript compile targets
npm run lint

# Assert security rule integrity
npm run test
```

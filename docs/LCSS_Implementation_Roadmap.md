# LingoLive Engineering Execution and Validation Guide

## Purpose and current conclusion

This document is the canonical execution tracker for the LingoLive ecosystem. It records what is implemented in the `main` branch, what has been tested, what remains partial, and which proposals still require an architectural decision.

The current product already has a substantial React, Express, Firebase and AI foundation. The next safe sequence is to consolidate the Web interface foundation, preserve Firebase as the current source of truth, complete the adaptive learning loop on that architecture, and only then expand the Flutter client. PostgreSQL and Supabase are not approved replacements for Firebase in this guide; they remain an architecture proposal until an ADR and migration plan are approved.

## Status legend

| Marker | Status | Meaning |
|---|---|---|
| `[V]` | Verified | Present in `main`, inspected and supported by build or relevant automated evidence |
| `[*]` | Implemented | Code exists, but production or end-to-end validation remains incomplete |
| `[~]` | Partial | Only part of the acceptance criteria exists |
| `[ ]` | Pending | No sufficient implementation evidence was found |
| `[!]` | Decision required | Work must not proceed until an architectural, legal or product decision is recorded |

Status is evidence-based. A visual prototype, static data, documentation, or an isolated code sample does not count as a completed production capability.

## Validation baseline

- Baseline branch: `main`
- Reviewed commit: `324d46937da8a037bf4452d42d5ca9795cedf100`
- Review date: 4 September 2026
- Production build: `[V]` completed successfully
- Automated suite: `[~]` 893 of 939 tests passed; 46 tests failed because the Vitest environment did not provide a usable `localStorage`
- Mobile application build: `[ ]` not available; the repository contains three standalone Dart files but no complete Flutter project
- Full browser and device validation: `[ ]` pending

## Master status board

| Phase | Module | Status | Evidence and annotation | Next approval gate |
|---|---|---:|---|---|
| 00 | Web Design System | `[~]` | Token package exists with color, typography, spacing, radius, motion, elevation, icon, breakpoint and z-index definitions. The shared UI package is still a README placeholder and existing screens do not consistently consume the tokens. | Build and document the primitive component library |
| 01 | Database and Authentication | `[V]` | Firebase Auth, Firestore, role-aware entry flow, protected server middleware and security rules exist. This approval applies to the Firebase architecture, not the proposed PostgreSQL schema. | Run emulator and deployed-project security validation |
| 02 | AI and Adaptive Learning Engine | `[~]` | Gemini and OpenAI integrations, CEFR context, adaptive profiles, recommendations, paths, pronunciation and tests exist. A persisted error-to-gap-to-remediation loop is not complete. | Implement real learning-gap aggregation and remove simulated fallbacks |
| 03 | Ebook Studio Web | `[*]` | Authenticated API, AI structure and chapter generation, improvement, title suggestions, exercises, tone analysis, Firestore save/list/delete, editor UI and PDF export exist. EPUB3, WebReader, block-based WYSIWYG and dedicated tests were not found. | Add persisted schema validation, tests and multi-format export |
| 04 | Flutter Student App | `[~]` | Profile, navigation and conversation wizard prototypes exist as standalone Dart files. Clean Architecture, dependency manifest, buildable app, reader, karaoke engine, exercises, offline sync and DRM are absent. | Create a real Flutter application and pass a device build |
| 05 | LingoLive Adaptive Synchronization Loop | `[~]` | Web learning profiles, attempts, adaptive paths and Firestore repositories exist. The new `student_learning_gaps` trigger and personalized fascicle generator are proposals only and target a different database. | Approve the canonical data architecture and implement the loop transactionally |
| 06 | Monetization and DRM | `[~]` | Stripe checkout/webhooks, PayPal routes, Multicaixa flows and a payment engine exist. Marketplace split payments, ebook entitlements, social watermarking and mobile reader DRM are not complete. | Prove sandbox transactions and define entitlement/author settlement rules |
| 07 | Deployment and Hardening | `[~]` | Docker, infrastructure files and specialized GitHub workflows exist. A complete Web and Flutter release pipeline, load evidence and production launch checklist are not complete. | Establish CI gates, load tests, observability and rollback evidence |

## Phase 00 Web Design System AppShell and Student Dashboard

### 00.1 Design tokens

`[V]` Token definitions exist under `packages/design-system/tokens` for colors, typography, spacing, radius, elevation, animation, motion, breakpoints, icons and z-index.

**Annotation:** This completes token definition, not adoption. Existing screens still contain raw color values and independent visual patterns.

**Acceptance remaining:** expose tokens through the Tailwind theme, add semantic surface/text/action tokens, support reduced motion, and migrate one complete student flow.

### 00.2 Shared UI components

`[ ]` The `packages/ui` package contains documentation only.

**Required scope:** Button, IconButton, Input, Select, Textarea, Checkbox, Switch, Badge, Card, Alert, Skeleton, EmptyState, ErrorState, Modal, Drawer, Dropdown, Tabs, PageHeader and PageContainer.

**Approval criterion:** typed APIs, keyboard operation, visible focus, accessible names, dark and child themes, component tests and local usage documentation.

### 00.3 AppShell and real routing

`[~]` Sidebar, top bar, global search and responsive drawer behavior exist. Navigation remains predominantly based on the `AppView` union and `setView`, with roughly 91 logical views controlled from a very large `App.tsx`.

**Approval criterion:** URL-backed routes, role guards, breadcrumbs, browser history, refresh-safe deep links, lazy loading and a temporary compatibility adapter for legacy views.

### 00.4 Student Dashboard

`[*]` A feature-rich student dashboard exists with practice, progress, goals, achievements, live sessions and recommendations.

**Acceptance remaining:** rebuild it on shared UI components, establish one primary learning action, remove unrelated first-fold content, use a single data aggregator, and validate loading, empty, partial-error and ready states.

### 00.5 Web accessibility and performance

`[~]` Responsive utilities and some accessible labels exist, but accessibility is not enforced by shared primitives. The production main bundle is approximately 4.89 MB minified and 1.28 MB compressed.

**Approval criterion:** keyboard-complete student flow, 200% zoom, reduced motion, contrast checks, semantic landmarks, route-level code splitting and an initial compressed bundle target below 500 KB.

## Phase 01 Infrastructure Database and Authentication

### 01.1 Canonical data platform

`[V]` Firestore is the current system of record. Repositories, security rules, Firebase Admin access and domain collections are present.

`[!]` The supplied PostgreSQL schema must not be deployed as a parallel source of truth without an Architecture Decision Record.

**Decision required:** choose one of these paths:

1. Keep Firestore canonical and translate the proposed relational entities into Firestore collections and server-side aggregates.
2. Adopt PostgreSQL only for bounded analytics or ledger workloads, with explicit ownership and event synchronization.
3. Migrate the whole learning domain to PostgreSQL through a versioned migration and rollback plan.

The recommended near-term path is option 1. It matches the deployed architecture and minimizes identity, authorization and synchronization risk.

### 01.2 Authentication and permissions

`[V]` Firebase Authentication, server-side token verification, role-aware entry flow and protected routes are implemented.

**Annotation:** The proposed `users.password_hash` and custom JWT layer conflict with Firebase Auth and are not approved. Password hashes must not be duplicated in the application database.

### 01.3 API gateway base

`[V]` Express routes, authentication middleware, CORS-related setup, request parsing and specialized rate limiting exist.

**Acceptance remaining:** document consistent error envelopes, request IDs, API versioning policy and endpoint-level rate limits.

### 01.4 Proposed PostgreSQL schema review

`[!]` Architecture candidate only.

Required corrections before any PostgreSQL adoption:

- The script enables `uuid-ossp` but calls `gen_random_uuid()`. Either enable `pgcrypto` or replace it with `uuid_generate_v4()`.
- The role enum omits existing roles such as teacher, native teacher, school administrator, parent, corporate administrator and super administrator.
- Identity must reference the Firebase UID or a documented identity mapping instead of storing a second password authority.
- Learning gaps need language, tenant and a normalized item key in their uniqueness boundary.
- Exercise attempts, error logs and gap updates should be committed in one transaction or produced through an idempotent event consumer.
- Row-level security, tenant isolation, audit columns, data retention and migration/version tooling are not defined.

## Phase 02 AI and Adaptive Learning Engine

### 02.1 AI provider integration

`[V]` Gemini and OpenAI provider paths are present and server-side secrets are used.

**Acceptance remaining:** finish the production audit of generic prompts, provider identity, fail-closed behavior and observability described in the open P0 work.

### 02.2 CEFR and learner context

`[*]` CEFR, age, language, regional context and learner preferences are represented across onboarding, tutor and adaptive services.

**Approval criterion:** one versioned context contract shared by tutor, pronunciation, exercises and ebook generation, with golden tests from A1 through C2.

### 02.3 Exercise generation

`[*]` AI exercise generation exists in the educational CMS and Ebook Studio.

**Approval criterion:** schema validation, answer integrity, age and CEFR constraints, persistence before response, and tests for malformed model output.

### 02.4 Audio and word synchronization

`[~]` Voice, recording and playback capabilities exist. The Web practice room contains a karaoke-like progression, but part of it is explicitly time-simulated. A backend-generated audio file with authoritative word timestamps was not found.

**Approval criterion:** provider-generated or aligned word timings, deterministic timestamp contract, audio/timing persistence and synchronization tests at normal and changed playback speeds.

### 02.5 Learning-gap aggregation

`[ ]` No production implementation matching `student_error_logs -> student_learning_gaps` was found.

Required behavior:

- record only real failed attempts;
- normalize language, category and target item;
- make updates idempotent;
- account for severity, recency, attempts and later successful mastery;
- recompute status from evidence instead of only increasing weakness;
- protect regional language variants from being classified as errors;
- retain an auditable link to the source attempt.

### 02.6 Personalized fascicle generation

`[~]` Generic Ebook Studio generation is implemented. Automatic generation from the learner's top persisted gaps is not implemented.

Corrections required in the supplied TypeScript proposal:

- Use the SDK's supported named `GoogleGenAI` import rather than assuming a default export.
- Map PostgreSQL snake_case fields to the camelCase `StudentGap` interface; as written, `totalFailures` and `weaknessScore` would be undefined.
- Handle a missing student profile explicitly.
- Use system instructions and structured output validation instead of a single interpolated prompt.
- Treat profile values and error text as untrusted prompt data and delimit them safely.
- Obtain consent and minimize personal data before sending a learner's full name, interests or profession to an AI provider.
- Add timeout, retry policy, provider/model audit, token/cost metrics and failure classification.
- Add an idempotency key so repeated requests do not create duplicate fascicles.
- Persist generation status, prompt version, model, source gap snapshot and validation result.
- Validate that exercises have correct answers and genuinely address the referenced gaps.

## Phase 03 Ebook Studio Web

### 03.1 AI-assisted project creation

`[*]` Structure generation, chapter generation, content improvement, title suggestions, exercise generation and tone analysis are implemented behind authenticated routes.

**Acceptance remaining:** dedicated unit/integration tests, strict response schemas, generation audit records and robust partial-failure recovery.

### 03.2 Editor

`[~]` A chapter-oriented editor and Markdown content workflow exist.

**Missing from the supplied target:** true block-based WYSIWYG behavior for rearranging text, tables, audio and callout blocks.

### 03.3 Persistence

`[*]` Ebook projects can be listed, saved and deleted in Firestore with author ownership checks.

**Approval criterion:** formal Firestore schema, versioning, autosave conflict handling, draft recovery and security-rule tests.

### 03.4 Export

`[~]` Client-side PDF export exists.

**Pending:** EPUB3, WebReader package, accessibility metadata, embedded audio/timestamps, server-side deterministic export and reader validation.

## Phase 04 Flutter Student Application

### 04.1 Application foundation

`[~]` Three standalone Dart prototypes exist for profile, navigation and conversation setup.

**Required implementation:** create a complete Flutter workspace with `pubspec.yaml`, `lib/app`, `lib/core`, feature-first modules, environment configuration, Firebase integration, tests and Android/iOS build targets.

**Recommended state management:** Riverpod, unless the team already has a maintained BLoC standard.

### 04.2 Ebook reader

`[ ]` Implement chapter navigation, semantic reading order, scalable typography, themes, bookmarks and offline availability.

**Decision required:** compare an EPUB renderer with a controlled native chapter renderer. Do not select a PDF-only reader if karaoke, semantic accessibility and responsive text are core requirements.

### 04.3 Karaoke engine

`[ ]` Implement `just_audio`, a validated word-timestamp model, efficient index lookup, seeking, speed changes and synchronization recovery.

**Engineering annotation:** the supplied linear scan over every timestamp on every position event is acceptable for a prototype but should be replaced by indexed progression or binary search for long chapters. Stream subscriptions must be stored and cancelled on reload/dispose.

### 04.4 Interactive exercises

`[ ]` Implement multiple choice, cloze, matching, listening and pronunciation activities with local persistence and server-confirmed scoring.

### 04.5 Offline synchronization

`[ ]` Implement an offline operation queue, conflict policy, retries, idempotency keys and visible sync state. Because Firestore is currently canonical, Supabase synchronization is not approved without the Phase 01 architecture decision.

### 04.6 Mobile DRM

`[ ]` Implement Android secure-window protection where appropriate and iOS capture detection with content obscuring.

**Product and legal annotation:** screenshot blocking cannot prevent photography by another device and should not be described as complete piracy prevention. Accessibility, legitimate user rights and platform-store policies must be reviewed.

## Phase 05 Adaptive Synchronization Loop

### 05.1 Event contract

`[ ]` Define a versioned learning event containing tenant, student, activity, language, CEFR, target item, answer evidence, correctness, severity, timestamps and idempotency key.

### 05.2 Gap projection

`[ ]` Build a server-side projector that transforms validated learning events into active, remediating or mastered gaps.

### 05.3 Just-in-time fascicle

`[ ]` Generate a micro-fascicle only when minimum evidence and confidence thresholds are met. Store the source gap snapshot and prompt/model version.

### 05.4 Completion feedback

`[ ]` Send reading and exercise evidence back through the same event contract, then update the gap score and learner dashboard.

### 05.5 End-to-end approval

`[ ]` Required scenario: a real failed exercise creates or updates a gap; the gap triggers a fascicle; the student completes it; successful evidence reduces the gap; the dashboard reflects the updated state across two devices.

## Phase 06 Monetization DRM and Entitlements

### 06.1 Checkout and payment events

`[*]` Stripe, PayPal and Multicaixa-related implementations exist.

**Approval criterion:** sandbox evidence for success, asynchronous success, failure, cancellation, duplicate webhook, refund and subscription changes.

### 06.2 Marketplace settlement

`[~]` Marketplace interfaces and payment foundations exist. A production-proven split-payment or author settlement flow was not confirmed.

**Decision required:** provider, merchant-of-record model, author onboarding, commissions, tax handling, refunds and payout eligibility.

### 06.3 Ebook entitlements

`[ ]` Define purchase, subscription, access revocation, offline license duration and device limits.

### 06.4 Social watermarking

`[ ]` Generate watermarks server-side from authorized purchase data. Avoid exposing unnecessary personal information and document retention/privacy rules.

## Phase 07 Deployment Testing and Launch

### 07.1 Continuous integration

`[~]` Geolinguistic and DevSecOps workflows exist.

**Approval criterion:** mandatory install, typecheck, unit tests, build, dependency/security scan and artifact retention for every protected-branch change.

### 07.2 Test reliability

`[~]` The suite has broad coverage but currently fails 46 tests because `localStorage` is unavailable in the configured test environment.

**Immediate action:** fix the shared Vitest environment/setup before using the suite as a merge gate.

### 07.3 Load and resilience

`[ ]` Produce load evidence for AI generation, ebook retrieval, learning-event ingestion and payment webhooks. Define timeouts, concurrency limits, queues and degradation behavior.

### 07.4 Release readiness

`[ ]` Require environment validation, migrations/indexes, observability dashboards, alerts, backup/restore evidence, rollback procedure and signed Web/Android/iOS artifacts.

## Approved execution sequence

1. Stabilize tests and document the current Firebase contracts.
2. Complete `packages/ui` and connect the existing design tokens to the Web application.
3. Introduce AppShell and URL-backed routing with a legacy compatibility adapter.
4. Rebuild and validate the Student Dashboard on the shared UI foundation.
5. Define the learning event and Firestore gap projection.
6. Extend Ebook Studio to generate persisted personalized fascicles from verified gaps.
7. Add authoritative audio word timings and export contracts.
8. Create the buildable Flutter application and implement the reader, karaoke and exercises.
9. Add offline synchronization, entitlements and DRM controls.
10. Complete deployment gates, device validation, load tests and staged release.

## Phase approval rules

A phase can be marked `[V]` only when all applicable evidence exists:

- code is merged into `main`;
- TypeScript/Dart analysis passes;
- relevant automated tests pass;
- production build succeeds;
- security and permission boundaries are tested;
- error, empty and unavailable states are verified;
- external-service behavior is proven in an appropriate sandbox or deployed environment;
- documentation identifies the validated commit and date;
- no known P0 issue contradicts the approval.

## Engineering progress log template

```text
DATE:
REVIEWED COMMIT:
PHASE AND ITEM:
OWNER:

STATUS: [ ] Pending  [~] Partial  [*] Implemented  [V] Verified  [!] Decision required

IMPLEMENTED:
-

EVIDENCE AND TESTS:
- Command or test:
- Result:
- Environment:

KNOWN RISKS OR ERRORS:
-

ARCHITECTURAL DECISIONS:
- ADR link or decision required:

NEXT ACTION:
-

APPROVAL:
- Reviewer:
- Date:
- Evidence link:
```

## Change history

### Version 2.0 - 4 September 2026

- Reconciled the tracker with the current `main` implementation.
- Marked Firebase Auth and Firestore as the current canonical architecture.
- Registered the PostgreSQL schema and trigger as a proposal requiring an ADR.
- Added the Web Design System, AppShell and Student Dashboard phase.
- Recorded the actual state of Ebook Studio, Flutter, adaptive learning, payments and CI.
- Added technical corrections for the supplied gap trigger, fascicle generator, karaoke controller and DRM assumptions.
- Replaced unchecked completion claims with evidence-based statuses and approval gates.


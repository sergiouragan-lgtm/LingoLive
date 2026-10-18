# Trusted agent skills for LingoLive

This directory documents **candidate agent guidance**, not installed runtime agents or ChatGPT plugins. Root `AGENTS.md` remains authoritative. No skill from an external repository may execute automatically or receive production credentials.

## Recommended roles and provenance

| Agent role | Candidate skill/source | Local use | Verification |
| --- | --- | --- | --- |
| Implementation planner | [obra/superpowers — writing-plans](https://github.com/obra/superpowers/tree/main/skills/writing-plans) | Produce bounded changes linked to an issue before editing | Review against `AGENTS.md` |
| TDD and debugging | [obra/superpowers — test-driven-development](https://github.com/obra/superpowers/tree/main/skills/test-driven-development), [systematic-debugging](https://github.com/obra/superpowers/tree/main/skills/systematic-debugging) | Require reproducing failures and tests before regression fixes | `npm run test:ci`, `npm run test:integration` |
| QA and release evidence | [obra/superpowers — verification-before-completion](https://github.com/obra/superpowers/tree/main/skills/verification-before-completion) | Collect check output, exit status and environment for all claims | `npm run check`, `npm run test:e2e` |
| Browser QA | [anthropics/skills — webapp-testing](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | Review real learner/admin workflows and access permissions | Playwright, screenshots, traces |
| Skill discovery | [vercel-labs/skills — find-skills](https://github.com/vercel-labs/skills/tree/main/skills/find-skills) | Discover candidates for manual review | Security and license checklist below |

The links above identify upstream candidates **only**. Verify the exact licensing terms, dependencies and pinned upstream commit **before copying or installing any contents**. Discovery does not imply trust, installation, compatibility or completion.

## Required security review before adoption

1. Confirm author/source, applicable license, current upstream commit hash, and approved version; record each in the PR.
2. Review the entire skill and any scripts, transitive dependencies, shell hooks, network requests and tool instructions for prompt injection, credential access, telemetry and exfiltration.
3. Minimize permissions; never expose Firebase service keys, Stripe secrets, private tokens, customer records or production write access to a third-party skill.
4. Trial in an isolated branch/workspace with harmless fixtures and no production credentials.
5. Require human review of changes, a reversible diff and an explicit rollback route. Do not run unreviewed external installation commands.

## Existing QA contract

The LingoLive `package.json` defines:
- `npm ci` — install from lockfile.
- `npm run typecheck` — TypeScript.
- `npm run test:ci` — unit tests.
- `npm run test:integration` — integration tests.
- `npm run test:firestore-rules` — Firestore emulator/rules tests.
- `npm run audit:prod` — production dependency audit.
- `npm run build` — production build.
- `npm run check` — chained gate for all the above.
- `npm run test:e2e` — Playwright end-to-end tests.

`make validate STRICT=1`, `make garden`, `make test` and `make smoke-test` are **not verified LingoLive Makefile targets**. Do not claim they ran. The current `.github/workflows/quality-gate.yml` runs `npm ci` and `npm run check` for PRs to main/develop; Playwright requires a separate explicit run or approved CI job.

For issue [#61](https://github.com/sergiouragan-lgtm/LingoLive/issues/61), no merge or production deployment until the canonical XP, progression, daily practice data, age/role restrictions and regressions are validated. The quality gate is **PENDING** until real command exit statuses and artifacts prove success.

## QA report template

| Command / check | Environment / commit | Exit code | Evidence link | Result |
| --- | --- | --- | --- | --- |
| `npm ci` | pending | not run | — | PENDING |
| `npm run check` | pending | not run | — | PENDING |
| `npm run test:e2e` | pending | not run | — | PENDING |
| Login / onboarding / billing / permissions smoke | pending | not run | — | PENDING |

A failed or missing check cannot be recorded as passed. Include exact failure logs and remediation commit before retesting.

## ChatGPT installation boundary

A GitHub repository containing `SKILL.md` does **not** automatically become a ChatGPT plugin. External ChatGPT plugins must be installed/connected through the user's approved ChatGPT flow. Repository-local guidance can be reviewed and adopted in the coding environment separately. Do not claim either installation occurred without confirmation.

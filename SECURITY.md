# Security policy

## Reporting a vulnerability

Do not disclose exploitable vulnerabilities in public issues. Contact the
repository owner privately through the security contact configured on GitHub
and include the affected component, reproduction steps, impact, and a proposed
embargo window.

Never include credentials, access tokens, production personal data, payment
records, health information, or student records in a report.

## Supported branch

Security fixes target the current `main` branch. The maintainers will
acknowledge a complete report, assess severity, prepare a regression test, and
coordinate remediation and disclosure.

## Required repository controls

The `Required Quality Gate / typecheck-tests-rules-build` check is the
repository's merge gate. GitHub branch protection or a repository ruleset must
require this check on `main`, require pull requests, dismiss stale approvals,
and block force pushes and branch deletion.

# Frontend redesign audit — public review copy

This audit establishes the current frontend route, API, form and component contracts before a design-system revamp. No application behavior changes are proposed.

The live audit verified the catalog-to-subscription journey, customer and plan editing, wallet creation and free-credit top-up, one-off invoicing, an adjustment credit note, simulated offline payment, and customer-portal navigation. Findings include responsive overflow, unassociated input labels, a rejected customer credit-note request hidden by an empty table, silent Unicode removal, and missing focus restoration.

## Included in this PR

- [Findings](FINDINGS.md): 14 findings, with live versus source evidence and reproduction guidance.
- [Coverage ledger](COVERAGE.md): verified flows, limitations and explicit untested branches.
- [Route/API map](ROUTE-API-MAP.md): 95 route declarations, including containers and duplicates.
- [API contracts](API-CONTRACTS.md): 314 service methods and request/response transformations.
- [Form/component map](FORM-COMPONENT-MAP.md): 723 component/page source files and candidate response-field reads.
- [Data-flow guide](DATA-FLOW.md): authentication, environment scope and domain response consumption.
- [Design-system preparation](DESIGN-SYSTEM-PREPARATION.md): existing patterns, acceptance matrix and migration dependencies.
- `data/`: source-derived inventories, including 482 API call sites, 528 type/interface contracts, asset hashes and existing-test inventory.
- `scripts/`: repeatable static extraction; see [usage](scripts/README.md).

## Private evidence boundary

The repository is public. The full audit package contains 174 screenshots, rendered account data, live fixture IDs and structural network logs. Those artifacts remain with the audit owner and are excluded from this PR, along with all login credentials and browser session state. Evidence filenames in the findings are private-package references, not missing files this PR promises to publish. Request the retained evidence through an appropriate private channel for detailed visual review.

The full run recorded 3,357 network events and 110 distinct method/URL combinations, including shared/external calls and entity-specific URLs. These counts are not normalized API endpoint counts or exhaustive workflow coverage.

## Provenance and validation

Source baseline: `a515674fa06197f9e8ccea3c78b40e6a5ac1ed65`. The deployed commit was not established; source and live observations are distinguished. Chromium was used at desktop, tablet and phone widths with selected dark-theme checks.

Static reachability includes optional drawers, tabs and shared imports; it is not proof that every listed API executes on mount. A source inventory is not a test of every component state. Other roles, provider authentication, real gateway checkout and integration execution remain unverified.

The original evidence package passed JSON/PNG/link validation, archive integrity and gallery filtering checks. This public subset is separately checked for valid JSON, reproducible extraction, repository-local links and accidental credential/account-data publication. Build, lint and unit-test results must come from CI before merge; this audit does not claim those suites were executed locally.

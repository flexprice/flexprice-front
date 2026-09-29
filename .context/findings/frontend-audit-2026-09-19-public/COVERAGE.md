# Coverage ledger

> Public review copy. References to screenshots, browser logs, fixture URLs and validation results identify evidence in the retained private audit package; those account-derived artifacts are intentionally not committed to this public repository. Static source inventories are included below.

## What each evidence level means

- **Source mapped**: route/component/service/type/form structure extracted from this checkout. It does not establish live execution or exhaustive path coverage.
- **Browser observed**: the page or form was opened, rendered content captured, and relevant network shapes recorded where the instrumented driver was used.
- **Workflow verified**: UI submission was followed by success state, persisted entity/detail or balance, and associated network evidence. This is not proof of every validation branch.
- **Not exercised**: explicitly outside the observed coverage; never count these as passed.

## Browser scope

| Area | Coverage | Evidence |
|---|---|---|
| Login | Successful email/password login, initial public surface | 001–002 captures; network auth shape |
| Main route sweep | 30 main paths in fresh audit environment | data/live-pages.json; sweep-* |
| Public routes | Root/login, verification paths, SAML callback, portal, checkout, onboarding, pricing setup, unknown route | data/public-pages.json; public-* |
| Create drawers | Plan, addon, cost sheet, group, price unit, coupon, customer, tax, API key, service account, bulk import, S3 connection | data/live-forms.json; form-* |
| Plan detail | Overview, entitlements, credit grants, information | details-01 to details-04 |
| Customer detail | Overview, information, wallet, invoices, tax, analytics, usage, direct credit-note route | details-05 to details-12 |
| Settings | Team, billing, portal, onboarding, alerts, appearance | details-13 to details-18 |
| Responsive | Home, customers, feature creation, plan, billing settings at 390/768/1440px | data/responsive.json |
| Dark theme | Populated plan and customer list | theme-dark-* |
| Existing data | an existing demo invoice list, payment/credit-note empty states, subscriptions, populated event table | data/existing-environment.json; existing-* |
| API contracts | 314 service methods, full source bodies and declared types | API-CONTRACTS.md; data/services.json |
| Consumers | 482 direct named API call sites and conservative route dependency reachability | ROUTE-API-MAP.md; data/calls.json |
| Forms and fields | Source controls, props, query keys and lexical response-field candidates | FORM-COMPONENT-MAP.md; data/components.json |
| Assets/tokens | File paths, sizes, hashes; CSS/Tailwind/sizing/theme sources | data/assets.json; data/design-foundations.json |

## Verified data creation and editing

All new entities belong to **the isolated audit sandbox** (an isolated audit sandbox). Existing an existing demo data was read only.

| Workflow | Observed outcome |
|---|---|
| Environment creation | Sandbox created and selected; dashboard empty states captured |
| Boolean feature | Audit Boolean Access saved and listed |
| Metered feature | Audit API Calls saved with event `audit_api_call`, Sum aggregation, property `count` |
| Plan | Audit Starter created, description edited and persisted |
| Fixed price | USD 29/month, arrear; staged and saved |
| Usage price | USD 0.01/unit/month for Audit API Calls; staged and saved |
| Entitlement | Audit Boolean Access added to plan, value Yes persisted |
| Customer | Audit Customer created; name edited to Audit Customer Edited and persisted |
| Subscription | Active monthly subscription created; upcoming invoice preview shows USD 29; editor opened |
| Addon | Audit Support Addon created and detail reached |
| Cost sheet | Audit Cost Sheet created and listed |
| Group | Audit Price Group created and listed |
| Tax | Audit Tax 5 Percent created |
| Coupon | Audit Five USD / AUDIT5 created and detail reached |
| Wallet | USD prepaid wallet created; free top-up of 100 credits persisted, transaction visible |
| One-off invoice | Audit service item, USD 10, finalized invoice created; payment and credit-note tabs opened |
| Customer portal | Generated valid session link opened; subscription and USD 100 wallet shown; Usage, Credits and Invoices tabs captured |
| Credit note | USD 2 adjustment created and finalized through confirmation dialog |
| Offline payment | USD 8 simulated payment recorded; invoice net payable USD 8, paid USD 8, remaining USD 0 |

Validation checks: empty customer Save disabled; malformed email blocked inline; duplicate plan lookup key rejected with retained form. Unicode preservation fails. Escape closes the customer drawer after the animation, but focus restoration to Add fails (`data/keyboard-settled.json` supersedes the immediate timing check in `validation-checks.json`). Invoice and credit-note editors were opened; a form-only screenshot is not evidence of a saved edit.

## Explicit limits and remaining matrix

This is broad source mapping and live workflow evidence, **not an exhaustive certification of every component, permission combination or financial lifecycle**.

- Only the supplied admin account was used. Viewer/member/write-only permission matrices and denied-action behavior were not verified with separate identities.
- Chrome/Chromium desktop automation was used. Firefox, WebKit, real mobile devices, assistive-technology sessions, contrast measurements and performance/load benchmarks remain untested.
- The app has many conditional pricing models, aggregation functions, trial/proration/commitment rules, subscription phases, currencies and tax combinations. Opening their shared editor is not testing every permutation.
- No real payment gateway/card transaction, OAuth provider authorization, SSO identity-provider round trip, cloud credential validation, external webhook delivery, email invitation, invoice communication or file import/export execution was performed.
- No tenant-wide billing, SAML, team or portal configuration was changed merely to fill coverage. Such changes could affect the other test environments in the shared tenant.
- No generated API secret was retained, no real card was added, and no credentials/token values are included in the package.
- Checkout is verified only for its missing/invalid-link state; a valid provider checkout session was not supplied.
- Public verification/callback pages lack real verification/SAML tokens; their successful external round trips remain untested.
- Workflow run/export run detail pages require actual integration/run fixtures. Static source mapping covers them; a list-page screenshot is not detail-page verification.
- Error/offline/slow-network/race/double-submit/concurrent-edit branches are not universally tested. The confirmed credit-note failure and selected validation checks are specific evidence.
- No claim is made that the deployed source equals commit `a515674fa06197f9e8ccea3c78b40e6a5ac1ed65`.
- Build/lint/unit suites were not run: this audit changes documentation/artifacts only, and the worktree has no installed local node_modules. Existing test cases were inventoried, not counted as executed passes.
- Early automation locator failures were corrected; they are not product defects. For example, Save has accessible name “Save plan charges”, and some menu options include descriptive text in their accessible name.
- Most captures allow a short render interval; the settled credit-note capture specifically waits through retries. No universal load-time guarantee is implied.

## Fixture retention

The dedicated audit environment is intentionally retained for reproduction and visual comparison. No existing environment was modified. To remove fixtures later, use dependency order: credits/documents/subscription relationships first, then customer, prices/entitlements, plan/catalog resources. Deletion was not exercised as part of this run and should not be represented as a verified workflow.

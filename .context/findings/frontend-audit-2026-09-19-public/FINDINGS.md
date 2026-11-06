# Findings and redesign constraints

> Public review copy. References to screenshots, browser logs, fixture URLs and validation results identify evidence in the retained private audit package; those account-derived artifacts are intentionally not committed to this public repository. Static source inventories are included below.

Evidence labels distinguish **live** browser observations, **source** findings, and **coverage gaps**. No production source code was changed. Severity reflects user impact, not a security certification.

## F01 — Horizontal overflow in phone and tablet layouts (high; live)

At a 390px viewport, customer list expands to 492px, feature creation to 639px, plan detail to 705px, and billing settings to 681px. At 768px, all five tested surfaces exceed the viewport (850–1125px). At 1440px these five surfaces fit. This is document-level overflow, not just an intentionally scrollable data table.

Evidence: `data/responsive.json`, `screenshots/responsive-390-feature.png`, `screenshots/responsive-390-plan.png`, and the corresponding 768px captures. The JSON identifies overflowing DOM elements. Full-page screenshots include the overflow and therefore are wider than the emulated viewport.

Reproduce: use 390×844 or 768×1000 and load feature creation, customer list, a populated plan, or billing settings. Compare `document.documentElement.scrollWidth` to `window.innerWidth`.

Design requirement: budget shell width, wrap/truncate breadcrumbs and utilities, adapt horizontal form groups, and contain table overflow. Test the actual viewport, not only a scaled desktop screenshot.

## F02 — Form labels are not reliably associated with inputs (high; live + source)

Feature creation and multiple drawers render visible labels but inputs have neither associated `<label>` elements nor explicit accessible names. `Input.tsx` passes optional `id` to both the input and label; callers frequently omit it. Error/description paragraphs are not automatically connected to the control.

Evidence: `data/live-pages.json`, `data/live-forms.json`; `src/components/atoms/Input/Input.tsx:206`, `:221`, `:250`. Existing page-object comments in `e2e/pages/CustomersPage.ts` and `PlansPage.ts` already document placeholder-based locators as a workaround.

Design requirement: stable generated IDs, label/description/error association, invalid state and focus behavior in the primitive. Do not treat a placeholder as a persistent label.

## F03 — Customer credit-note route sends a rejected request (high; live + source)

The directly registered customer credit-note route issues GET `/v1/creditnotes` with `expand` and receives HTTP 400. Initial browser capture displays “Great things take time, almost there!” rather than useful recovery guidance. This route is registered even though the visible customer tabs do not include Credit Note.

Evidence: `data/network.jsonl` records the HTTP 400s on `/billing/customers/:id/credit-note`; `screenshots/details-12.png`. Source `src/pages/customer/creditnotes/CreditNote.tsx:27` sends `expand: 'invoice,invoice.customer'`, then filters `data.items` client-side by nested customer ID, without supplying a customer filter. This can also produce incomplete customer results if only one server page is fetched. After retries settle, the page displays an empty table without surfacing the error. The captured response explicitly says “Field is not allowed to be expanded”, with `details.field: customer`. See `data/credit-note-errors.json` and `screenshots/bug-customer-credit-note-settled.png`.

Design requirement: supported server-side customer filtering, explicit error/retry state, and consistent discoverability for registered routes.

## F04 — Unsupported SAML configuration is repeatedly fetched (low; live + source)

GET `/v1/settings/saml_config` returns 404 and is retried. Source `useSamlConfig.ts` explicitly models 404 as SAML unavailable and hides the tab. Therefore the 404 itself is expected for this deployment; repeated attempts are avoidable overhead, not proof that SSO is broken.

Evidence: network log and `src/pages/settings/saml-sso/useSamlConfig.ts`. Consider disabling retries for known terminal capability errors while retaining retries for transient failures.

## F05 — API response typing does not provide runtime validation (high migration risk; source)

The API layer predominantly passes TypeScript response types through Axios generics. The shared response interceptor returns `response.data`; the verbs cast the returned value to the requested type. A source search found no Zod `parse`/`safeParse` calls in `src/api`. This does not mean no validation exists anywhere in the app—checkout token validation is one counterexample—but ordinary service responses are not demonstrated to be runtime-validated.

Evidence: `src/core/axios/config.ts`, `src/core/axios/verbs.ts`, API-CONTRACTS.md and `data/contracts.json`.

Design requirement: keep explicit transport-to-view-model adapters and add runtime schemas at fragile boundaries before replacing hundreds of consumers.

## F06 — Environment failures masquerade as empty data (medium; source)

`EnvironmentApi.getAllEnvironments` catches all failures and returns an empty environment list; `getEnvironmentById` returns null. A consumer cannot distinguish a failed request from a genuinely empty or missing environment. `useEnvironment` also reads and polls localStorage for the active environment ID.

Evidence: `src/api/EnvironmentApi.ts:46` onward; `src/hooks/useEnvironment.ts`. Not reproduced by disrupting the production API.

Design requirement: explicit loading/error/empty states and a stable environment boundary. Preserve the existing request gate while changing the shell.

## F07 — Default text input silently excludes many writing systems (medium; live + source)

`sanitizeEnglishOnly` removes characters outside printable ASCII and Basic Arabic; `englishOnly` defaults true. Names in other scripts and accented Latin characters can be silently transformed. This is particularly relevant because the app also includes localization.

Evidence: `src/components/atoms/Input/Input.tsx:55` onward. Live reproduction: entering `José ग्राहक 東京` into customer name results in `Jos  `, recorded in `data/validation-checks.json`.

Design requirement: make character restrictions domain-specific and visible; avoid global silent name sanitization.

## F08 — Icon actions and generic “Add” labels need accessible context (medium; live + source)

Plan action menus and edit controls use icon-only buttons without explicit names at several call sites. Subscription configuration has multiple “Add” buttons distinguished only by their sections. Automated form inspection also finds blank-text buttons; those are candidates for review, not all proven inaccessible (a title or labelled-by may supply a name).

Evidence: `data/live-details.json`, `src/pages/product-catalog/plans/PlanDetailsPage.tsx:302`, `PlanInformationTab.tsx`, and populated subscription configuration screenshot.

Design requirement: “Plan actions”, “Edit customer”, “Add tax”, “Add addon”, and other domain-specific names; preserve visible context for assistive technology.

## F09 — Duplicate route declarations and undiscoverable route candidates (medium; source)

Checkout is registered twice and the customer usage-events child is repeated. Route constants also include paths with no corresponding active route declaration (for example meter-related constants and commented analytics). Registered container routes, redirects and duplicate entries must not be counted as distinct working screens.

Evidence: `data/routes.json`, `src/core/routes/Routes.tsx`. The extracted 95 declarations are deliberately not presented as 95 verified pages.

Design requirement: reconcile the route registry, navigation and permission matrix before moving screen ownership.

## F10 — Existing query behavior and side effects need explicit migration ownership (medium; source)

The global QueryClient uses zero garbage-collection time and suppresses several automatic refetch triggers. Query keys often omit environment IDs, so safe environment changes depend on shell behavior. `useCustomerPortalUrl` invokes a service directly from an event handler without TanStack mutation state, contrary to the stated repository invariant.

Evidence: `src/core/services/tanstack/ReactQueryProvider.tsx`, `src/hooks/useCustomerPortalUrl.ts`. These are migration constraints; no cross-environment data leak is claimed.

Design requirement: preserve invalidation semantics, define environment-scoped keys, and standardize pending/error/double-submit behavior.

## F11 — Temporal copy is inconsistent on the empty dashboard (low; live)

The Recent Subscriptions card says “Created in the last 7 days” while its empty message says “No subscriptions created in the last 24 hours.” The audit environment screenshot contains both.

Evidence: `screenshots/005-audit-environment-created.png`, matching text in `data/005-audit-environment-created.txt`.

Design requirement: derive all period copy from the same source as the query window.

## F12 — Meter event example contains a fixed historical timestamp (low; live)

The metered-feature example displays a 2025 timestamp during a September 2026 audit. Copying it literally can make sample events disappear from current-period views.

Evidence: `screenshots/feature-type-metered.png`, `data/feature-type-metered.txt`.

Design requirement: generate a current example timestamp or clearly mark the field as requiring replacement.

## Documentation drift

The supplied constitution describes React 18. This checkout's package.json declares React 19.2.8 and react-router 8.3.0. These are declared dependency versions, not an assertion about installed or deployed versions. Record actual runtime/package-lock versions when planning the migration.

## F13 — Drawer dismissal does not restore trigger focus (medium; live)

After opening Add Customer, entering an unsaved name and pressing Escape, the drawer closes after its animation, but focus does not return to the Add trigger. The initial immediate check was too early to classify dismissal; the settled check corrects that result.

Evidence: `data/keyboard-settled.json`, `screenshots/validation-escape-settled.png`. Verify other drawers independently rather than extrapolating one result to every dialog.

## F14 — Duplicate lookup-key error identifies the wrong field (low; live)

Submitting a different plan name with an existing lookup key is rejected with “Plan with this name already exists”. The editor remains open, preserving input, but the message points users at the name instead of the conflicting key.

Evidence: `data/validation-checks.json`, `screenshots/validation-duplicate-plan-key.png`.

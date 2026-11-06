# Design-system preparation brief

This is an audit of the current implementation, not a proposed visual redesign. Preserve the documented domain behavior while replacing presentation. The source checkout and deployed app are separate evidence sets; the deployed commit is not exposed.

## Product surfaces

| Surface | Existing patterns | Migration considerations |
|---|---|---|
| Authentication | Region picker, login/signup, password reset, SAML, OAuth, verification | Session and region are prerequisites; retain redirects and public error states. |
| Application shell | Collapsible navigation, environment selector, breadcrumbs, command search, theme, help/API panels | Environment must be unmistakable; long names currently truncate. Preserve keyboard access and environment-scoped request sequencing. |
| Home/revenue | Time range and window controls, charts, summary cards, recent entities | Distinguish no activity, no results, unavailable data and loading; labels must describe the selected time interval. |
| Catalog | Search/filter/sort tables, drawers, detail tabs, archive operations | Shared resource list/detail pattern; use domain-specific action names rather than relying on nearby headings to explain “Add”. |
| Feature creation | Full-page form, conditional Boolean/static/metered/config fields, meter aggregation | Conditional validation and payload construction belong in stable business logic. Do not flatten metering choices into a generic text form. |
| Prices | Fixed/usage charge editors, multiple billing models, currency/period/cadence, two-stage add/save | Make staged versus persisted changes visible. Keep decimal precision and quantity semantics intact. |
| Customers | List/drawer, profile tabs, wallet, invoices, taxes, analytics, usage | Stable resource header and consistent tab navigation; preserve external IDs and relation links. |
| Subscriptions | Customer/plan selection, price quantities, phases, discounts, commitments, credits, taxes, addons, billing configuration | Progressive disclosure and a persistent summary are candidates; price preview and mutation rules need separate contracts. |
| Financial documents | Invoice detail/edit, credit notes, payments, wallet adjustments | Explicit lifecycle and action eligibility. Prevent visual restyling from changing rounding, sign, currency or status semantics. |
| Developer tools | Events/query, keys, service accounts, webhooks, workflow runs | Code and JSON viewing, copy controls, secret reveal, permission-aware actions need first-class primitives. |
| Imports/exports/integrations | Upload/configuration wizards, run status, provider-specific forms | Preserve external dependencies, async progress, retry behavior and partial-failure explanations. |
| Settings | Team, billing, portal, onboarding, alerts, appearance, optional SAML | Some settings affect the entire tenant, not just the selected environment. Mark scope clearly in future design. |
| Public customer surfaces | Portal and multi-provider checkout | Independently test token expiry, invalid token, provider availability, and embedded/mobile layout. Admin login does not prove these work. |

## Existing foundations to retain or reconcile

- Tailwind and Radix primitives coexist with custom `atoms`, `molecules`, `organisms` and `components/ui` components. The inventory includes every source component file rather than assuming one folder is the entire design system.
- `src/lib/sizing.ts` defines 24/32/40/48px control heights and a 36px icon control. Align the replacement system around intentional density modes and verify hit areas independently from visual height.
- `src/index.css` and Tailwind configuration hold semantic color tokens and theme mappings. Exact source snapshots are in `data/design-foundations.json`.
- Shared Input uses an optional caller-provided ID for label association. Generate stable IDs and connect labels, descriptions and errors in the replacement primitive. Verify `aria-invalid`, `aria-describedby`, focus ring, disabled and read-only states.
- Shared Input defaults to ASCII plus Basic Arabic sanitization. International name entry needs an explicit product decision; otherwise a design-system migration will reproduce silent text removal.
- Toasts, inline errors, disabled submit buttons, no-data tables and instructional empty-state cards all need consistent state definitions.
- Public assets are cataloged with hashes in `data/assets.json`; retain provenance and avoid bundling unused images as new design-system assets.

## Component acceptance matrix

Every replacement primitive should have keyboard, focus, disabled, pending, error, overflow, light/dark and localization checks. Application tests must additionally cover:

| Pattern | Required states |
|---|---|
| Field | Empty, required, malformed, valid, server rejection, long/Unicode/pasted value, helper text, read-only |
| Select/combobox | No options, loading, search, no match, selected item, clear, keyboard navigation, long labels |
| Resource table | Empty environment, filtered-empty, populated, loading, failure, pagination, selection, action menu, long content |
| Drawer/dialog | Initial focus, focus trap, Escape, outside click, dirty dismissal, pending save, duplicate submission, return focus |
| Detail tabs | Direct URL entry, refresh, missing entity, permission denial, archived entity, loading/error per tab |
| Monetary input | Zero, decimal precision, currency formatting, negative values where allowed, large amounts, quantity and rounding |
| Date control | Timezone, locale, keyboard entry, invalid range, optional versus required date, subscription-boundary behavior |
| Status/action | Every lifecycle state and allowed transition; copy and button eligibility must agree with backend state |
| Async work | Queued, running, success, partial success, failure, cancellation and retry |

## Migration sequencing

1. Freeze route/API/field contracts and add missing workflow assertions around existing behavior.
2. Build foundations and accessible controls; verify them against live forms before mass replacement.
3. Migrate application shell and one representative resource list/detail/drawer family.
4. Migrate feature/meter and price editors together with their validation and preview contracts.
5. Migrate subscriptions and financial workflows with explicit lifecycle regression checks.
6. Migrate developer/settings/provider surfaces and public portal/checkout separately.
7. Compare old/new screenshots and run behavioral contracts against the same seeded environment.

No new design tokens, visual direction or production application code were introduced by this audit.

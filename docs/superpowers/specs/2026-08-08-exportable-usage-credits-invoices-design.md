# Exportable Usage / Credits / Invoices Components — Design

**Date:** 2026-08-08
**Status:** Approved (sub-project 1 of the broader "more exportable components" initiative — see Context)

## Context

The frontend already ships `@flexprice/flexprice-ui`, a published npm package (`packages/flexprice-ui`) built from `src/exportable/index.ts` via `vite.flexprice-ui.config.ts`. It currently exports one feature: the pricing widget (`PricingCard` / `PricingTable`, `src/pricing/`), built as prop-only, "bring your own data" React components with a runtime Zod validation boundary (`src/pricing/schema.ts`) and bundled i18n (`src/pricing/i18n.ts`) so external consumers get safe defaults without needing the dashboard's auth/router/i18n setup.

This is sub-project 1 of a larger initiative (docs site with live preview, an interactive playground, `llm_context.txt`, a CLI, and shadcn registry distribution — each tracked as its own follow-up spec). This spec covers only: extending the existing pattern to 8 new components covering usage, credits, invoices, and subscriptions.

The target UI already exists as dashboard-internal widgets in `src/components/customer-portal/widgets/*.tsx`, rendered by a config-driven system: `CustomerPortal.tsx` → `SectionContent.tsx` (fetches shared data, owns the date-filter UI) → `TabRenderer.tsx` (dispatches by `tab.type` to a lazy-loaded widget). Four other files in that directory (`OverviewTab.tsx`, `UsageAnalyticsTab.tsx`, `WalletTab.tsx`, `InvoicesTab.tsx`) are dead code — only self-exported from the barrel, never rendered — and are out of scope here.

## Component scope

8 components, extending the user's 5 requested groups with 2 already-cheap additions:

| Exported name | Source widget | Group |
|---|---|---|
| `UsageTrendChart` | `UsageGraphWidget` | Usage trend chart with filters |
| `UsageQuota` | `CurrentUsageWidget` | Usage quota |
| `UsageBreakdown` | `UsageBreakdownWidget` | Usage breakdown |
| `MetricCards` | `MetricCardsWidget` | (bonus — cheap, already scoped) |
| `CreditBalance` | `WalletBalanceWidget` | Credits |
| `CreditHistory` | `WalletTransactionsWidget` | Credit history |
| `InvoiceList` | `InvoicesWidget` | Invoices |
| `SubscriptionList` | `SubscriptionsWidget` | (bonus — cheap, already scoped) |

`UsageQuota` and `SubscriptionList` are already prop-only today (modulo theming); the other six currently self-fetch via `useQuery` + `CustomerPortalApi` and read `usePortalConfig()` for theming — both need to be removed for the exported version.

## Directory layout

Four new top-level feature directories, each mirroring `src/pricing/`'s shape (this is also what the placeholder comments in `src/exportable/index.ts` already anticipate — `@/usage/lib`, etc.):

```text
src/usage/
  types.ts / adapters.ts / schema.ts / i18n.ts / lib.ts
  components/
    UsageTrendChart.tsx
    UsageQuota.tsx
    UsageBreakdown.tsx
    MetricCards.tsx
  containers/
    UsageTrendChartContainer.tsx
    UsageQuotaContainer.tsx
    UsageBreakdownContainer.tsx
    MetricCardsContainer.tsx

src/credits/
  ...same shape...
  components/CreditBalance.tsx, CreditHistory.tsx
  containers/CreditBalanceContainer.tsx, CreditHistoryContainer.tsx

src/invoices/
  ...same shape...
  components/InvoiceList.tsx
  containers/InvoiceListContainer.tsx

src/subscriptions/
  ...same shape...
  components/SubscriptionList.tsx
  containers/SubscriptionListContainer.tsx
```

**Naming rule:** `components/` holds UI-concept names (what the package exports). `containers/` holds `<ComponentName>Container.tsx` (dashboard-only, app-specific, never exported). `lib.ts` exports only the component names — never a `*Container`. This keeps the package's public API unambiguous.

`src/exportable/index.ts` gets one new line per feature (`export * from '@/usage/lib';`, etc.), and `tailwind.flexprice-ui.config.js` / `vite.flexprice-ui.config.ts`'s `dtsInclude` get the matching content globs — the same one-line-per-feature aggregation already used for pricing.

## Theming contract

All new components use Tailwind utility classes bound to the existing `--brand` / `--radius` token set plus a `.dark` ancestor class — the convention `PricingCard` already ships. No component reads `PortalConfigContext` or `--portal-*` variables, and no inline `style={{ backgroundColor: 'var(...)' }}`. This is the standing rule for every future exportable component, documented as a comment at `src/exportable/index.ts`: **`PortalConfigContext` and `--portal-*` tokens are internal-portal-only and must never be a dependency of an exported component.**

## Data flow & validation boundary

```text
Internal (dashboard) path:
  API DTO → adapter (validates + normalizes + maps to Presentational Model) → Container → Component → normalize() safety-net (no-op on already-valid data) → render

External ("bring your own data") path:
  Consumer's own data → consumer's own mapping, or an exported adapter → Component → normalize() safety-net (the real firewall here) → render
```

- **Adapters are the authoritative validation/transformation boundary.** Each feature's `adapters.ts` is pure (no React, no hooks) and independently unit-testable, converting backend DTOs into the feature's typed Presentational Model — mirroring `src/pricing/adapters.ts`.
- **Containers** (dashboard-only, not exported) own the `useQuery` / `CustomerPortalApi` call, run the adapter, and render the presentational component with a valid, typed model. The internal dashboard path never hands the component invalid data.
- **Components additionally run a lightweight `normalize()` safety net** on their own public props (their own Zod schema in `schema.ts`, matching `src/pricing/schema.ts`'s pattern) — this operates only on the component's own prop shape, never on a backend DTO, so the component stays decoupled from Flexprice's API shapes. This is a no-op for already-valid data (the internal path pays nothing extra) and is the actual crash-prevention firewall for external consumers who pass raw/malformed data directly. This preserves `PricingTable`'s existing, already-reviewed behavior rather than introducing a stricter rule only for the new components.
- Each feature also gets bundled i18n (`i18n.ts` via `createBundledT`, mirroring `src/pricing/i18n.ts`) so external consumers without an initialized i18next still get real English strings.

## Refactoring internal usage (no duplicate implementations)

`TabRenderer.tsx` is repointed from the raw `widgets/*.tsx` files to the new `*Container` components (e.g. `UsageTrendChartContainer` instead of `UsageGraphWidget`). `SectionContent.tsx` is unaffected in its public contract — it keeps owning the section-level date filter and the two shared queries (`portal-subscriptions`, `portal-usage`), passed down as props exactly as today, just terminating in a container instead of a self-fetching widget. Once all 8 are migrated, the old `widgets/*.tsx` files are deleted — there is exactly one implementation of each widget's UI, matching the precedent PR #1169 set for the pricing widget replacing `Pricing.tsx`'s inline implementation.

## Testing

Co-located `*.test.tsx` per component (adapters get plain `*.test.ts`), per `AGENTS.md`. Presentational components are tested with mock props only — no query/context mocking required, which is itself evidence the decoupling worked. Adapters are tested independently of any component.

## Non-goals for this batch

- No composed "full dashboard" bundle component (e.g. a single `<CustomerPortalWidgets />`). Ship atomic components matching `PricingCard`'s granularity; a composed bundle can be a later addition once the individual pieces are proven.
- No changes to the dead `OverviewTab` / `UsageAnalyticsTab` / `WalletTab` / `InvoicesTab` files — flagging/removing them is a separate cleanup, out of scope here.
- Docs site with live preview + code toggle, the interactive playground, `llm_context.txt`, the CLI, and shadcn registry distribution are separate specs, sequenced after this one.

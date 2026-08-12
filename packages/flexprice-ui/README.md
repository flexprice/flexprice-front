# @flexprice/ui

Drop-in **React** components extracted from the Flexprice dashboard, so your app renders the
exact same UI: pricing, usage, and credits widgets. **Bring your own data** — the components are
purely presentational (no fetching, no auth, no routing).

## Install

```bash
npm install @flexprice/ui
```

`react` and `react-dom` (v18 or v19) are peer dependencies.

## Usage

Import the stylesheet once (ships the theme tokens + only the utilities the widget uses):

```tsx
import '@flexprice/ui/style.css';
import { PricingTable, PricingCard, type Plan } from '@flexprice/ui';
```

### `PricingTable` — the full grid

```tsx
const plans: Plan[] = /* fetch + map your Flexprice plans (see adapters below) */;

<PricingTable
  plans={plans}
  billingPeriod={period}
  onBillingPeriodChange={setPeriod}
  billingPeriodOptions={[{ label: 'Monthly', value: 'MONTHLY' }]}
  currency={currency}
  onCurrencyChange={setCurrency}
  currencyOptions={[{ label: 'USD', value: 'USD' }]}
  onSelectPlan={(planId) => router.push(`/checkout/${planId}`)}
/>
```

### `PricingCard` — a single plan, use standalone

```tsx
<PricingCard {...plan} useModernChrome onSelectPlan={handleSelect} />
```

Both are individual components — compose your own layout with `PricingCard`, or use
`PricingTable` for the standard responsive grid.

## Bring your own data

The `plans` prop is the presentational `Plan` shape (decoupled from the Flexprice API). If you
fetch raw Flexprice plans/prices/entitlements, map them with the exported adapters:

```ts
import { adaptPlanToCard, filterAndSortPlans } from '@flexprice/ui';

const cards = filterAndSortPlans(plansWithData, 'USD', 'MONTHLY').map((p) => adaptPlanToCard(p, grants));
```

Or build the `Plan` objects yourself — see the exported `Plan` / `Feature` types.

## Usage widgets

`UsageQuota`, `MetricCards`, `UsageTrendChart`, and `UsageBreakdown` render usage/cost analytics.
Each takes a presentational prop shape (`UsageQuotaItem`, `MetricCardItem`, `UsageTrendSeries`,
`UsageBreakdownRow`) — map your own data to these, or use the exported adapters
(`adaptUsageQuotaItems`, `adaptMetricCards`, `adaptUsageTrendSeries`, `adaptUsageBreakdownRows`)
against raw Flexprice API responses. `normalizeUsageQuotaItems` and friends are a runtime safety
net you can call on untrusted/BYO data before rendering.

```tsx
import { UsageQuota, adaptUsageQuotaItems } from '@flexprice/ui';

<UsageQuota items={adaptUsageQuotaItems(customerUsageFromApi)} />;
```

## Credits widgets

`CreditBalance` and `CreditHistory` render wallet balance and transaction history. They take
`CreditBalanceData` / `CreditTransaction[]` — map your own data, or use `adaptCreditBalance`,
`adaptCreditTransactions`, and `adaptWalletOptions` against raw Flexprice wallet responses.
`normalizeCreditBalanceData` and `normalizeCreditTransactions` are the same runtime safety net.

```tsx
import { CreditBalance, adaptCreditBalance } from '@flexprice/ui';

<CreditBalance wallet={adaptCreditBalance(walletFromApi)} />;
```

## Theming

Override the CSS variables with a selector that matches `.flexprice-ui` itself — the tokens are
declared on that element, so an override on an *ancestor* loses the cascade and silently does
nothing. Add `class="dark"` for dark mode.

```css
.my-pricing .flexprice-ui { --primary: 243 75% 59%; }
```

`--radius` and `--brand` exist for parity with the app theme, but the library build resolves
Tailwind's radius scale to literals, so overriding `--radius` has no effect on the emitted
utilities. `--primary` is the live accent hook.

## Dark mode

The stylesheet includes a `.dark` variant. Toggle it by adding the `dark` class to any ancestor.

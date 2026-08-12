// @flexprice/ui — THE PUBLISHED PACKAGE ENTRY (umbrella).
//
// `npm i @flexprice/ui` gives a consumer every exportable Flexprice UI component from
// one import: pricing (PricingTable, PricingCard), usage (UsageQuota, MetricCards,
// UsageTrendChart, UsageBreakdown), and credits (CreditBalance, CreditHistory). As more
// components are made exportable, add one line here (e.g. `export * from '@/checkout/lib';`)
// plus its content glob to `tailwind.flexprice-ui.config.js` and its `dtsInclude` entry in
// `vite.flexprice-ui.config.ts` — nothing else changes.
//
// Each feature owns its own public surface in `src/<feature>/lib.ts` (UI-only, no data layer).
// This file only aggregates them and ships the shared stylesheet.

// Shared theme tokens + the Tailwind utilities every exported component uses (imported once).
import './styles.css';

// ── Pricing widget ───────────────────────────────────────────────────────────
export * from '@/pricing/lib';

// ── Usage widgets ────────────────────────────────────────────────────────────
export * from '@/usage/lib';

// ── Credits widgets ──────────────────────────────────────────────────────────
export * from '@/credits/lib';

// ── Future components (uncomment as they become exportable) ───────────────────
// export * from '@/checkout/lib';
// export * from '@/invoices/lib';
// export * from '@/subscriptions/lib';

// Pricing widget — dashboard-facing barrel (`@/pricing`).
//
// The dashboard imports from here; it exposes both the prop-only UI and the data-connected
// container:
//   • prop-only UI (PricingTable, PricingCard) — bring your own data,
//   • a data-connected container (PricingContainer) for the dashboard / API-backed use,
//   • presentational types and the pure DTO→Plan adapters.
//
// The published package (@flexprice/ui) does NOT ship the container — its entry is the
// UI-only `./lib.ts`, aggregated by `src/exportable/index.ts`.

// Prop-only UI (no fetching / auth / routing)
export { default as PricingTable } from './components/PricingTable';
export { default as PricingCard, type PricingCardProps, type UsageCharge } from '@/components/molecules/PricingCard/PricingCard';

// Data-connected container (dashboard / API-backed)
export { default as PricingContainer, type PricingContainerProps, type PricingContainerView } from './containers/PricingContainer';

// Data hook (swap-point for an injected client when published externally)
export { usePricingData, type UsePricingDataResult } from './hooks/usePricingData';

// Presentational types
export type { Plan, Feature, CreditGrantLine, PricingOption, PricingTableProps, PlanType } from './types';

// Pure DTO → presentational adapters
export {
	adaptPlanToCard,
	filterAndSortPlans,
	deriveCurrencyPeriodOptions,
	findBestPriceCombination,
	getPriceDisplayType,
	isRecurringPrice,
	isUsageBasedPrice,
	mapCreditGrantToCardProps,
	type PlanWithData,
} from './adapters';

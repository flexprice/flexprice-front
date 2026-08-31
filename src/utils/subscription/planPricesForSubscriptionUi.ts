import type { Price } from '@/models/Price';
import { BILLING_PERIOD } from '@/constants/constants';
import { isCadenceCompatible } from './cadenceCompatibility';

/** Plan/catalog price is a one-time charge (backend: billing_period ONETIME). */
export function isOneTimePlanPrice(price: { billing_period: string | BILLING_PERIOD }): boolean {
	return String(price.billing_period).toUpperCase() === BILLING_PERIOD.ONETIME;
}

function isExactSubscriptionCadence(price: Price, subPeriod: BILLING_PERIOD, subCount: number): boolean {
	const priceCount = price.billing_period_count ?? 1;
	return String(price.billing_period).toUpperCase() === String(subPeriod).toUpperCase() && priceCount === subCount;
}

export interface PlanPricePartition {
	/**
	 * Prices attached by default: plan prices whose cadence exactly matches the
	 * subscription cadence (same period AND same count) plus all ONETIME prices in
	 * the subscription's currency. Matches the new backend default when
	 * `include_price_ids` is omitted.
	 */
	primary: Price[];
	/**
	 * Prices the user can opt into: plan prices whose cadence is a strict divisor
	 * of the subscription cadence (finer cadence — e.g. Monthly on a Quarterly sub).
	 * These fan out into N line items per subscription invoice at backend attach
	 * time; frontend renders them under an opt-in section and only sends them via
	 * `include_price_ids` when the user selects them.
	 */
	additional: Price[];
}

/**
 * Split a plan's prices into what the subscription attaches by default vs. what the
 * user can opt into. Currency mismatches are dropped from both partitions. See the
 * per-price-cadence-selection design doc for the UX these partitions drive.
 */
export function partitionPricesForSubscription(
	prices: Price[],
	subPeriod: BILLING_PERIOD,
	subCount: number,
	currency: string,
): PlanPricePartition {
	const currencyLower = currency.toLowerCase();
	const primary: Price[] = [];
	const additional: Price[] = [];
	for (const p of prices) {
		if (p.currency.toLowerCase() !== currencyLower) continue;
		if (isOneTimePlanPrice(p)) {
			primary.push(p);
			continue;
		}
		if (isExactSubscriptionCadence(p, subPeriod, subCount)) {
			primary.push(p);
			continue;
		}
		if (isCadenceCompatible(subPeriod, subCount, p.billing_period, p.billing_period_count)) {
			additional.push(p);
		}
	}
	return { primary, additional };
}

/**
 * Legacy helper retained for callers that still want the flat "compatible-plus-onetime"
 * list. New code should use `partitionPricesForSubscription` and render the two groups
 * separately. Behavior matches partition.primary ∪ partition.additional.
 */
export function filterPlanPricesForSubscriptionCharges(
	prices: Price[],
	selectedRecurringPeriod: BILLING_PERIOD,
	currency: string,
	selectedRecurringPeriodCount: number = 1,
): Price[] {
	const { primary, additional } = partitionPricesForSubscription(prices, selectedRecurringPeriod, selectedRecurringPeriodCount, currency);
	return [...primary, ...additional];
}

/**
 * Stable string key identifying a (period, count) cadence tuple. Used to opt whole
 * cadence groups in/out of the subscription (e.g. "MONTHLY:1" checks in every monthly
 * price on the plan). Uppercased period + numeric count keep the key JSON-safe.
 */
export function cadenceKey(period: BILLING_PERIOD | string, count: number | undefined): string {
	const c = Math.max(1, count ?? 1);
	return `${String(period).toUpperCase()}:${c}`;
}

export interface AdditionalCadenceGroup {
	key: string;
	period: BILLING_PERIOD;
	count: number;
	prices: Price[];
}

/**
 * Bucket the `additional` partition by cadence so the UI can render one opt-in row per
 * cadence (with a single fan-out hint) instead of one per price. Preserves plan order.
 */
export function groupAdditionalPricesByCadence(additional: Price[]): AdditionalCadenceGroup[] {
	const groups = new Map<string, AdditionalCadenceGroup>();
	for (const p of additional) {
		const period = String(p.billing_period).toUpperCase() as BILLING_PERIOD;
		const count = p.billing_period_count ?? 1;
		const key = cadenceKey(period, count);
		const existing = groups.get(key);
		if (existing) {
			existing.prices.push(p);
		} else {
			groups.set(key, { key, period, count, prices: [p] });
		}
	}
	return [...groups.values()];
}

/** Distinct recurring billing periods on a plan (excludes ONETIME — not selectable as subscription cadence). */
export function uniqueRecurringBillingPeriodsFromPrices(prices: { billing_period: string | BILLING_PERIOD }[]): BILLING_PERIOD[] {
	const set = new Set<BILLING_PERIOD>();
	for (const p of prices) {
		if (isOneTimePlanPrice(p)) continue;
		const key = p.billing_period.toUpperCase();
		if ((Object.values(BILLING_PERIOD) as string[]).includes(key)) {
			set.add(key as BILLING_PERIOD);
		}
	}
	return [...set];
}

// Pure DTO → presentational mapping for the pricing widget.
//
// Everything here is side-effect free and framework-agnostic (no React, no hooks). The
// container calls these to turn API responses into `Plan` (PricingCardProps) objects and to
// derive the currency / billing-period options.

import type { PlanResponse, PriceResponse, EntitlementResponse } from '@/types';
import { Price, BILLING_PERIOD, INVOICE_CADENCE, PRICE_TYPE, CREDIT_GRANT_CADENCE, type CreditGrant, type Tier } from '@/models';
import { PlanType } from '@/constants/planTypes';
import { billlingPeriodOptions } from '@/constants/constants';
import type { Plan, PricingOption } from './types';
import { isPercentagePrice } from '@/utils/common/percentage_price_helpers';

export type PlanWithData = PlanResponse & { prices: PriceResponse[]; entitlements: EntitlementResponse[] };

// Structural subset of PriceResponse the pure helpers below actually read. Defined via Pick
// so a real PriceResponse (or PlanWithData['prices'][number]) is assignable without any cast.
type PriceLike = Pick<
	PriceResponse,
	'currency' | 'billing_period' | 'billing_model' | 'type' | 'amount' | 'tiers' | 'meter' | 'invoice_cadence' | 'metadata'
>;

export const parseAmount = (amount: string | undefined): number => {
	if (!amount) return 0;
	const parsed = parseFloat(amount);
	return isNaN(parsed) ? 0 : parsed;
};

export const isRecurringPrice = (price: PriceLike) =>
	price.type === PRICE_TYPE.FIXED && price.billing_period?.toUpperCase() !== BILLING_PERIOD.ONETIME;

export const isUsageBasedPrice = (price: PriceLike) => price.type === PRICE_TYPE.USAGE;

export const getPriceDisplayType = (prices: PriceLike[]): PlanType => {
	if (!prices || prices.length === 0) return PlanType.USAGE_ONLY;

	const recurringPrices = prices.filter(isRecurringPrice);
	const usagePrices = prices.filter(isUsageBasedPrice);

	const hasNonZeroRecurring = recurringPrices.some((p) => parseAmount(p.amount) > 0);
	const allRecurringZero = recurringPrices.every((p) => parseAmount(p.amount) === 0);

	if (recurringPrices.length > 0 && !usagePrices.length && allRecurringZero) return PlanType.FREE;
	if (recurringPrices.length > 0 && usagePrices.length > 0 && allRecurringZero) return PlanType.HYBRID_FREE;
	if (recurringPrices.length > 0 && usagePrices.length > 0) return PlanType.HYBRID_PAID;
	if (usagePrices.length > 0 && recurringPrices.length === 0) return PlanType.USAGE_ONLY;
	if (recurringPrices.length > 0 && hasNonZeroRecurring) return PlanType.FIXED;

	return PlanType.USAGE_ONLY;
};

export function grantPlanId(grant: CreditGrant, fallbackPlanId: string): string {
	const g = grant as CreditGrant & { planId?: string };
	return grant.plan_id ?? g.planId ?? fallbackPlanId;
}

export function mapCreditGrantToCardProps(grant: CreditGrant): NonNullable<Plan['creditGrants']>[number] {
	const cadence = grant.cadence === CREDIT_GRANT_CADENCE.RECURRING ? ('recurring' as const) : ('onetime' as const);
	return {
		name: grant.name,
		credits: grant.credits,
		cadence,
		period: grant.period ? grant.period.toLowerCase() : null,
	};
}

/** Pick the currency + billing period that shows the most plans (preferring recurring pricing). */
export const findBestPriceCombination = (
	plans: PlanWithData[],
	availableCurrencyOptions: Array<{ value: string }>,
	availablePeriodOptions: Array<{ value: string }>,
) => {
	let maxPlans = 0;
	let bestCurrency = '';
	let bestPeriod = '';

	// Preferred: the recurring-price combination that shows the MOST plans (not merely the first
	// non-empty one), so the default view maximizes visible plans.
	for (const currency of availableCurrencyOptions) {
		for (const period of availablePeriodOptions) {
			const testFiltered = plans
				.map((plan) => ({
					...plan,
					prices: plan.prices?.filter(
						(price: PriceResponse) =>
							price.currency.toUpperCase() === currency.value && price.billing_period === period.value && isRecurringPrice(price),
					),
				}))
				.filter((plan) => plan.prices && plan.prices.length > 0);

			if (testFiltered.length > maxPlans) {
				maxPlans = testFiltered.length;
				bestCurrency = currency.value;
				bestPeriod = period.value;
			}
		}
	}

	if (maxPlans > 0) {
		return { currency: bestCurrency, period: bestPeriod, hasPreferred: true };
	}

	for (const currency of availableCurrencyOptions) {
		for (const period of availablePeriodOptions) {
			const testFiltered = plans
				.map((plan) => ({
					...plan,
					prices: plan.prices?.filter(
						(price: PriceResponse) => price.currency.toUpperCase() === currency.value && price.billing_period === period.value,
					),
				}))
				.filter((plan) => (plan.prices?.length ?? 0) > 0);

			if (testFiltered.length > maxPlans) {
				maxPlans = testFiltered.length;
				bestCurrency = currency.value;
				bestPeriod = period.value;
			}
		}
	}

	return { currency: bestCurrency, period: bestPeriod, hasPreferred: false };
};

export interface CurrencyPeriodOptions {
	allCurrencyOptions: PricingOption[];
	allPeriodOptions: PricingOption[];
	availableCurrencyOptions: PricingOption[];
	availablePeriodOptions: PricingOption[];
}

/** Collect currency / period options and narrow them by the current selection. */
export function deriveCurrencyPeriodOptions(
	plans: PlanWithData[],
	selectedCurrency: string,
	selectedBillingPeriod: string,
): CurrencyPeriodOptions {
	const currencies = new Set<string>();
	plans.forEach((plan) => plan.prices?.forEach((price) => currencies.add(price.currency)));

	const allCurrencyOptions = Array.from(currencies).map((currency) => ({
		label: currency.toUpperCase(),
		value: currency.toUpperCase(),
	}));
	const allPeriodOptions = billlingPeriodOptions;

	const availableCurrencyOptions = selectedBillingPeriod
		? allCurrencyOptions.filter((currency) =>
				plans.some((plan) =>
					plan.prices?.some((price) => price.currency.toUpperCase() === currency.value && price.billing_period === selectedBillingPeriod),
				),
			)
		: allCurrencyOptions;

	const availablePeriodOptions = selectedCurrency
		? allPeriodOptions.filter((period) =>
				plans.some((plan) =>
					plan.prices?.some((price) => price.currency.toUpperCase() === selectedCurrency && price.billing_period === period.value),
				),
			)
		: allPeriodOptions;

	return { allCurrencyOptions, allPeriodOptions, availableCurrencyOptions, availablePeriodOptions };
}

/** Filter each plan's prices to the active currency + period, drop empty plans, and sort for display. */
export function filterAndSortPlans(plans: PlanWithData[], selectedCurrency: string, selectedBillingPeriod: string): PlanWithData[] {
	const filtered = plans
		.map((plan) => ({
			...plan,
			prices:
				plan.prices?.filter(
					(price) => price.currency.toUpperCase() === selectedCurrency && price.billing_period === selectedBillingPeriod,
				) || [],
		}))
		.filter((plan) => plan.prices?.length > 0);

	return filtered.sort((a, b) => {
		const getRecurringAmount = (plan: PlanWithData) => {
			const recurringPrice = plan.prices?.find((price) => isRecurringPrice(price));
			return recurringPrice ? parseFloat(recurringPrice.amount || '0') : 0;
		};
		const getUsageFlag = (plan: PlanWithData) => (plan.prices?.some((price) => price.type === PRICE_TYPE.USAGE) ? 1 : 0);

		const r1 = getRecurringAmount(a);
		const r2 = getRecurringAmount(b);
		if (r1 !== r2) return r1 - r2;
		return getUsageFlag(a) - getUsageFlag(b);
	});
}

/** Map one filtered plan (+ its credit grants) into a presentational `Plan` (PricingCardProps). */
export function adaptPlanToCard(plan: PlanWithData, grants: CreditGrant[]): Plan {
	const prices = plan.prices as Price[];
	const displayType = getPriceDisplayType(prices);
	const recurringPrice = prices?.find((p) => isRecurringPrice(p));
	const usageCharges =
		prices
			?.filter((p) => isUsageBasedPrice(p))
			.map((price) => ({
				amount: price.amount,
				currency: price.currency,
				billing_model: price.billing_model,
				// The card has no access to price metadata, so resolve the percentage marker here.
				is_percentage: isPercentagePrice(price),
				// price.tiers is Tier[] | null; UsageCharge.tiers is non-nullable and Tier structurally
				// matches its element (up_to widens to number | null), so assert the Tier[] shape here.
				tiers: price.tiers as Tier[],
				meter_name: price.meter?.name || 'Usage',
				billing_period: price.billing_period,
				type: price.type,
				invoice_cadence: price.invoice_cadence as INVOICE_CADENCE,
			})) || [];

	const displayPrice = recurringPrice || usageCharges[0];

	return {
		id: plan.id,
		name: plan.name,
		description: plan.description,
		price: {
			amount: displayPrice?.amount,
			currency: displayPrice?.currency,
			billingPeriod: displayPrice?.billing_period,
			type: displayPrice?.type,
			displayType,
			// `usageCharges` entries are plain display objects with no `metadata`, and
			// `isPercentagePrice` keys off `metadata.billing_model`, so re-deriving the flag from a
			// usage-charge `displayPrice` always yields false. Reuse the value already computed above
			// from the real price (which does carry metadata) for the usage-only case.
			is_percentage: recurringPrice ? isPercentagePrice(recurringPrice) : (usageCharges[0]?.is_percentage ?? false),
		},
		usageCharges,
		entitlements:
			plan.entitlements?.map((e) => ({
				id: e.id,
				feature_id: e.feature?.id || '',
				name: e.feature?.name || '',
				type: e.feature_type.toUpperCase() as 'STATIC' | 'BOOLEAN' | 'METERED',
				value:
					e.feature_type === 'boolean' ? e.is_enabled : e.feature_type === 'metered' ? e.usage_limit || 'Unlimited' : e.static_value || '',
				description: e.feature?.description,
				usage_reset_period: e.usage_reset_period || '',
			})) || [],
		creditGrants: grants.map(mapCreditGrantToCardProps),
	};
}

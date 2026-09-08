import { BILLING_PERIOD } from '@/constants/constants';
import { Price } from '@/models/Price';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import { LineItemCommitmentConfig, LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';
import { enrichCommitmentTimeBucketsForApi } from '@/utils/common/commitment_helpers';
import { isCadenceCompatible } from '@/utils/subscription/cadenceCompatibility';
import { isOneTimePlanPrice } from '@/utils/subscription/planPricesForSubscriptionUi';

/**
 * Filter addon prices to those the subscription can attach: same currency, plus a cadence
 * that equals or evenly divides the subscription cadence (ONETIME always attaches, per the
 * backend's ONETIME-passes rule). Mirrors backend `filterValidPricesForSubscription`, which
 * runs the same `IsCadenceCompatible` check for both PLAN and ADDON entity types — so a
 * monthly addon shows up (and attaches) on a quarterly sub, fanning out per month at billing.
 */
export function filterAddonPricesForSubscription(
	prices: Price[] = [],
	billingPeriod?: BILLING_PERIOD,
	currency?: string,
	billingPeriodCount: number = 1,
): Price[] {
	let filtered = prices;
	if (currency) {
		filtered = filtered.filter((p) => p.currency?.toLowerCase() === currency.toLowerCase());
	}
	if (billingPeriod) {
		filtered = filtered.filter(
			(p) => isOneTimePlanPrice(p) || isCadenceCompatible(billingPeriod, billingPeriodCount, p.billing_period, p.billing_period_count),
		);
	}
	return filtered;
}

/** Merge commitment config + time buckets from CommitmentConfigDialog into stored addon state. */
export function buildCommitmentConfigOnSave(
	config: LineItemCommitmentConfig,
	timeBuckets?: CommitmentTimeBucket[],
): LineItemCommitmentConfig {
	const hasBuckets = (timeBuckets?.length ?? 0) > 0;

	if (config.is_window_commitment && hasBuckets) {
		const { commitment_time_buckets: _buckets, ...parentConfig } = config;
		return {
			...parentConfig,
			commitment_time_buckets: timeBuckets,
		};
	}

	return {
		...config,
		commitment_time_buckets: timeBuckets?.length ? timeBuckets : undefined,
	};
}

/** Enrich addon line_item_commitments for POST /subscriptions and POST /subscriptions/addon. */
export function sanitizeAddonLineItemCommitmentsForApi(
	commitments: LineItemCommitmentsMap | undefined,
	prices: Price[],
): LineItemCommitmentsMap | undefined {
	if (!commitments || Object.keys(commitments).length === 0) {
		return undefined;
	}

	const pricesById = new Map(prices.map((price) => [price.id, price]));
	const sanitized: LineItemCommitmentsMap = {};

	for (const [priceId, config] of Object.entries(commitments)) {
		const price = pricesById.get(priceId);
		const buckets = config.commitment_time_buckets;
		const hasBuckets = buckets && buckets.length > 0;

		if (config.is_window_commitment && hasBuckets && price) {
			const { commitment_time_buckets: _buckets, ...parentConfig } = config;
			sanitized[priceId] = {
				...parentConfig,
				commitment_time_buckets: enrichCommitmentTimeBucketsForApi(buckets, config, price),
			};
		} else {
			sanitized[priceId] = config;
		}
	}

	return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

import { describe, expect, it } from 'vitest';
import { BILLING_PERIOD } from '@/constants/constants';
import type { Price } from '@/models/Price';
import { PRICE_TYPE } from '@/models';
import { cadenceKey, groupAdditionalPricesByCadence, partitionPricesForSubscription } from './planPricesForSubscriptionUi';

function makePrice(overrides: { id: string; billing_period: BILLING_PERIOD; billing_period_count?: number; currency?: string }): Price {
	return {
		id: overrides.id,
		amount: '10',
		currency: overrides.currency ?? 'usd',
		type: PRICE_TYPE.FIXED,
		billing_period: overrides.billing_period,
		billing_period_count: overrides.billing_period_count ?? 1,
		display_name: overrides.id,
	} as unknown as Price;
}

describe('partitionPricesForSubscription', () => {
	it('routes exact-cadence prices to primary and finer-cadence to additional', () => {
		const prices = [
			makePrice({ id: 'quarterly_a', billing_period: BILLING_PERIOD.QUARTERLY }),
			makePrice({ id: 'monthly_a', billing_period: BILLING_PERIOD.MONTHLY }),
		];
		const { primary, additional } = partitionPricesForSubscription(prices, BILLING_PERIOD.QUARTERLY, 1, 'usd');
		expect(primary.map((p) => p.id)).toEqual(['quarterly_a']);
		expect(additional.map((p) => p.id)).toEqual(['monthly_a']);
	});

	it('routes ONETIME to primary regardless of sub cadence', () => {
		const prices = [
			makePrice({ id: 'onetime_a', billing_period: BILLING_PERIOD.ONETIME }),
			makePrice({ id: 'quarterly_a', billing_period: BILLING_PERIOD.QUARTERLY }),
		];
		const { primary, additional } = partitionPricesForSubscription(prices, BILLING_PERIOD.QUARTERLY, 1, 'usd');
		expect(primary.map((p) => p.id).sort()).toEqual(['onetime_a', 'quarterly_a']);
		expect(additional).toEqual([]);
	});

	it('drops coarser-cadence prices from both partitions', () => {
		const prices = [
			makePrice({ id: 'annual_a', billing_period: BILLING_PERIOD.ANNUAL }),
			makePrice({ id: 'quarterly_a', billing_period: BILLING_PERIOD.QUARTERLY }),
		];
		const { primary, additional } = partitionPricesForSubscription(prices, BILLING_PERIOD.QUARTERLY, 1, 'usd');
		expect(primary.map((p) => p.id)).toEqual(['quarterly_a']);
		expect(additional).toEqual([]);
	});

	it('filters by currency (case-insensitive)', () => {
		const prices = [
			makePrice({ id: 'usd_price', billing_period: BILLING_PERIOD.QUARTERLY, currency: 'USD' }),
			makePrice({ id: 'eur_price', billing_period: BILLING_PERIOD.QUARTERLY, currency: 'eur' }),
		];
		const { primary, additional } = partitionPricesForSubscription(prices, BILLING_PERIOD.QUARTERLY, 1, 'usd');
		expect(primary.map((p) => p.id)).toEqual(['usd_price']);
		expect(additional).toEqual([]);
	});

	it('routes multiple additional-cadence prices into additional partition', () => {
		const prices = [
			makePrice({ id: 'annual', billing_period: BILLING_PERIOD.ANNUAL }),
			makePrice({ id: 'half', billing_period: BILLING_PERIOD.HALF_YEARLY }),
			makePrice({ id: 'quarterly', billing_period: BILLING_PERIOD.QUARTERLY }),
			makePrice({ id: 'monthly', billing_period: BILLING_PERIOD.MONTHLY }),
			makePrice({ id: 'onetime', billing_period: BILLING_PERIOD.ONETIME }),
		];
		const { primary, additional } = partitionPricesForSubscription(prices, BILLING_PERIOD.ANNUAL, 1, 'usd');
		expect(primary.map((p) => p.id).sort()).toEqual(['annual', 'onetime']);
		expect(additional.map((p) => p.id).sort()).toEqual(['half', 'monthly', 'quarterly']);
	});

	it('respects billing_period_count for exact-match (quarterly x 2 sub vs quarterly x 1 price is NOT exact)', () => {
		const prices = [
			makePrice({ id: 'q1', billing_period: BILLING_PERIOD.QUARTERLY, billing_period_count: 1 }),
			makePrice({ id: 'q2', billing_period: BILLING_PERIOD.QUARTERLY, billing_period_count: 2 }),
		];
		const { primary, additional } = partitionPricesForSubscription(prices, BILLING_PERIOD.QUARTERLY, 2, 'usd');
		expect(primary.map((p) => p.id)).toEqual(['q2']);
		// quarterly x 1 (3 months) divides quarterly x 2 (6 months) → compatible finer
		expect(additional.map((p) => p.id)).toEqual(['q1']);
	});
});

describe('cadenceKey', () => {
	it('normalizes period to uppercase and pins count', () => {
		expect(cadenceKey(BILLING_PERIOD.MONTHLY, 1)).toBe('MONTHLY:1');
		expect(cadenceKey('monthly', 1)).toBe('MONTHLY:1');
		expect(cadenceKey(BILLING_PERIOD.QUARTERLY, 2)).toBe('QUARTERLY:2');
	});

	it('defaults undefined / non-positive counts to 1', () => {
		expect(cadenceKey(BILLING_PERIOD.MONTHLY, undefined)).toBe('MONTHLY:1');
		expect(cadenceKey(BILLING_PERIOD.MONTHLY, 0)).toBe('MONTHLY:1');
	});
});

describe('groupAdditionalPricesByCadence', () => {
	it('buckets multiple monthly prices under a single MONTHLY:1 group in plan order', () => {
		const additional = [
			makePrice({ id: 'monthly_a', billing_period: BILLING_PERIOD.MONTHLY }),
			makePrice({ id: 'monthly_b', billing_period: BILLING_PERIOD.MONTHLY }),
		];
		const groups = groupAdditionalPricesByCadence(additional);
		expect(groups).toHaveLength(1);
		expect(groups[0].key).toBe('MONTHLY:1');
		expect(groups[0].period).toBe(BILLING_PERIOD.MONTHLY);
		expect(groups[0].count).toBe(1);
		expect(groups[0].prices.map((p) => p.id)).toEqual(['monthly_a', 'monthly_b']);
	});

	it('separates by count', () => {
		const additional = [
			makePrice({ id: 'q1', billing_period: BILLING_PERIOD.QUARTERLY, billing_period_count: 1 }),
			makePrice({ id: 'q2', billing_period: BILLING_PERIOD.QUARTERLY, billing_period_count: 2 }),
		];
		const groups = groupAdditionalPricesByCadence(additional);
		expect(groups.map((g) => g.key).sort()).toEqual(['QUARTERLY:1', 'QUARTERLY:2']);
	});

	it('returns empty array for empty input', () => {
		expect(groupAdditionalPricesByCadence([])).toEqual([]);
	});
});

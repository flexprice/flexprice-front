import { describe, it, expect } from 'vitest';
import { adaptPlanToCard, type PlanWithData } from './adapters';
import { PlanType } from '@/constants/planTypes';

// A percentage charge is stored as a FLAT_FEE whose amount holds the decimal equivalent
// (5% -> "0.05"), tagged via metadata. See utils/common/percentage_price_helpers.
const percentageMetadata = { billing_model: 'percentage' };

const makePrice = (overrides: Record<string, unknown>) =>
	({
		id: 'price-1',
		currency: 'usd',
		billing_period: 'MONTHLY',
		billing_model: 'FLAT_FEE',
		type: 'FIXED',
		amount: '0.05',
		tiers: null,
		meter: null,
		invoice_cadence: 'ARREAR',
		metadata: null,
		...overrides,
	}) as never;

const makePlan = (prices: unknown[]): PlanWithData =>
	({
		id: 'plan-1',
		name: 'Plan',
		description: '',
		prices,
		entitlements: [],
	}) as unknown as PlanWithData;

// `usageCharges` is optional on the card props; the adapter always emits an array.
const usageCharges = (card: ReturnType<typeof adaptPlanToCard>) => card.usageCharges ?? [];

describe('adaptPlanToCard percentage headline price', () => {
	it('reports a recurring percentage price as a percentage', () => {
		const card = adaptPlanToCard(makePlan([makePrice({ type: 'FIXED', metadata: percentageMetadata })]), []);

		expect(card.price.is_percentage).toBe(true);
		expect(card.price.amount).toBe('0.05');
	});

	// Regression: `displayPrice` fell back to the metadata-less `usageCharges[0]` display object, so
	// re-deriving the flag from it always produced false and the card rendered $0.05 instead of 5%.
	it('reports a usage-only percentage plan as a percentage', () => {
		const card = adaptPlanToCard(
			makePlan([makePrice({ type: 'USAGE', metadata: percentageMetadata, meter: { name: 'Transactions' } })]),
			[],
		);

		expect(card.price.displayType).toBe(PlanType.USAGE_ONLY);
		expect(usageCharges(card)[0].is_percentage).toBe(true);
		expect(card.price.is_percentage).toBe(true);
	});

	it('leaves a usage-only non-percentage plan as a plain amount', () => {
		const card = adaptPlanToCard(makePlan([makePrice({ type: 'USAGE', amount: '0.5', meter: { name: 'Requests' } })]), []);

		expect(usageCharges(card)[0].is_percentage).toBe(false);
		expect(card.price.is_percentage).toBe(false);
	});

	// A stale marker on a price since switched away from FLAT_FEE must not turn tiers into percentages.
	it('ignores a stale percentage marker on a tiered usage charge', () => {
		const card = adaptPlanToCard(
			makePlan([
				makePrice({
					type: 'USAGE',
					billing_model: 'TIERED',
					metadata: percentageMetadata,
					tiers: [{ up_to: 100, unit_amount: '0.05', flat_amount: null }],
					meter: { name: 'Requests' },
				}),
			]),
			[],
		);

		expect(card.price.is_percentage).toBe(false);
	});

	// A recurring price wins the headline slot, so a percentage usage charge must not leak into it.
	it('keeps the recurring headline price non-percentage when only the usage charge is a percentage', () => {
		const card = adaptPlanToCard(
			makePlan([
				makePrice({ id: 'price-fixed', type: 'FIXED', amount: '20' }),
				makePrice({ id: 'price-usage', type: 'USAGE', metadata: percentageMetadata, meter: { name: 'Transactions' } }),
			]),
			[],
		);

		expect(card.price.amount).toBe('20');
		expect(card.price.is_percentage).toBe(false);
		expect(usageCharges(card)[0].is_percentage).toBe(true);
	});
});

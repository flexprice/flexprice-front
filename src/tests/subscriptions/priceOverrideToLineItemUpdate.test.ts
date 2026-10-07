import { describe, it, expect } from 'vitest';
import { BILLING_MODEL, TIER_MODE } from '@/models/Price';
import { convertPriceOverrideToLineItemUpdate } from '@/utils/subscription/priceOverrideToLineItemUpdate';

const tiers = [
	{ up_to: 720, unit_amount: '3.6', flat_amount: '0' },
	{ up_to: null, unit_amount: '4.5', flat_amount: '0' },
];

describe('convertPriceOverrideToLineItemUpdate', () => {
	it.each([
		['SLAB_TIERED', { billing_model: BILLING_MODEL.TIERED, tier_mode: TIER_MODE.SLAB }],
		[BILLING_MODEL.TIERED, { billing_model: BILLING_MODEL.TIERED, tier_mode: TIER_MODE.VOLUME }],
		[BILLING_MODEL.FLAT_FEE, { billing_model: BILLING_MODEL.FLAT_FEE }],
		[BILLING_MODEL.PACKAGE, { billing_model: BILLING_MODEL.PACKAGE }],
	] as const)('sends %s as an explicit billing model and tier mode', (selectValue, expected) => {
		expect(convertPriceOverrideToLineItemUpdate('price_1', { billing_model: selectValue, tiers })).toEqual({ ...expected, tiers });
	});

	it('forwards custom price unit fields', () => {
		expect(convertPriceOverrideToLineItemUpdate('price_1', { price_unit_amount: '12', price_unit_tiers: tiers })).toEqual({
			price_unit_amount: '12',
			price_unit_tiers: tiers,
		});
	});
});

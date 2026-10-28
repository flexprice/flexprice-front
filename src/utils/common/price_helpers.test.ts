import { describe, it, expect } from 'vitest';
import {
	formatPriceDisplay,
	normalizePriceDisplay,
	getBillingModelLabel,
	getPriceTableCharge,
	NormalizedPriceDisplay,
} from './price_helpers';
import { PERCENTAGE_BILLING_MODEL } from './percentage_price_helpers';
import { BILLING_MODEL, Price, PRICE_TYPE, TIER_MODE, PRICE_UNIT_TYPE } from '@/models/Price';

const base: NormalizedPriceDisplay = {
	amount: '0',
	symbol: '$',
	tiers: null,
	billingModel: BILLING_MODEL.FLAT_FEE,
	tierMode: TIER_MODE.VOLUME,
	transformQuantity: null,
	priceUnitType: PRICE_UNIT_TYPE.FIAT,
};

describe('formatPriceDisplay', () => {
	it('caps a long floating-point decimal tail to 6 places instead of rendering it in full', () => {
		expect(formatPriceDisplay({ ...base, amount: '0.066666666666667' })).toBe('$0.066667');
	});

	it('leaves short, common decimal amounts unchanged', () => {
		expect(formatPriceDisplay({ ...base, amount: '5.00' })).toBe('$5.00');
		expect(formatPriceDisplay({ ...base, amount: '19.99' })).toBe('$19.99');
	});

	it('leaves whole-number amounts unchanged', () => {
		expect(formatPriceDisplay({ ...base, amount: '100' })).toBe('$100');
	});

	it('caps the divideBy-derived unit amount for PACKAGE billing', () => {
		expect(
			formatPriceDisplay({
				...base,
				billingModel: BILLING_MODEL.PACKAGE,
				amount: '0.066666666666667',
				transformQuantity: { divide_by: 15 },
			}),
		).toBe('$0.066667 / 15 units');
	});

	it('shows the backend display_amount for a saved fiat per-token rate', () => {
		expect(formatPriceDisplay(normalizePriceDisplay(savedPrice('0.00000025', '₹0.00000025', 'INR')))).toBe('₹0.00000025');
	});

	it('shows the custom-unit display string, not the converted fiat display_amount', () => {
		const price = {
			amount: '0.0000025',
			display_amount: '₹0.0000025',
			price_unit_amount: '0.00000025',
			display_price_unit_amount: 'CR0.00000025',
			currency: 'INR',
			price_unit_type: PRICE_UNIT_TYPE.CUSTOM,
			billing_model: BILLING_MODEL.FLAT_FEE,
			tier_mode: TIER_MODE.VOLUME,
			tiers: null,
			transform_quantity: null,
			metadata: null,
		} as unknown as Price;

		expect(formatPriceDisplay(normalizePriceDisplay(price))).toBe('CR0.00000025');
	});

	it('formats an override from its amount when the saved display_amount is stale', () => {
		const price = savedPrice('0.00000025', '$0.00000025');
		expect(formatPriceDisplay(normalizePriceDisplay(price, { amount: '1.50' } as never))).toBe('$1.50');
	});

	it('caps the first tier unit amount for TIERED billing', () => {
		expect(
			formatPriceDisplay({
				...base,
				billingModel: BILLING_MODEL.TIERED,
				tiers: [{ up_to: 100, unit_amount: '0.066666666666667', flat_amount: '0' }],
			}),
		).toBe('starts at $0.066667 per unit');
	});
});

const savedPrice = (amount: string, displayAmount: string, currency = 'USD'): Price =>
	({
		amount,
		display_amount: displayAmount,
		currency,
		billing_model: BILLING_MODEL.FLAT_FEE,
		tier_mode: TIER_MODE.VOLUME,
		price_unit_type: PRICE_UNIT_TYPE.FIAT,
		tiers: null,
		transform_quantity: null,
		metadata: null,
	}) as unknown as Price;

const percentagePrice = (amount: string, overrides: Partial<Price> = {}): Price =>
	({
		amount,
		currency: 'USD',
		billing_model: BILLING_MODEL.FLAT_FEE,
		tier_mode: TIER_MODE.VOLUME,
		price_unit_type: PRICE_UNIT_TYPE.FIAT,
		tiers: null,
		transform_quantity: null,
		metadata: { billing_model: 'percentage' },
		...overrides,
	}) as unknown as Price;

describe('percentage charges', () => {
	it('renders the stored decimal as the percentage the user entered', () => {
		expect(formatPriceDisplay(normalizePriceDisplay(percentagePrice('0.05')))).toBe('5%');
		expect(formatPriceDisplay(normalizePriceDisplay(percentagePrice('0.10')))).toBe('10%');
		expect(formatPriceDisplay(normalizePriceDisplay(percentagePrice('0.025')))).toBe('2.5%');
	});

	it('surfaces the percentage billing model, not the flat fee it is stored as', () => {
		expect(normalizePriceDisplay(percentagePrice('0.05')).billingModel).toBe(PERCENTAGE_BILLING_MODEL);
		expect(getBillingModelLabel(PERCENTAGE_BILLING_MODEL)).toBe('Percentage Fee');
	});

	it('renders an untagged flat fee as a currency amount', () => {
		expect(formatPriceDisplay(normalizePriceDisplay(percentagePrice('0.05', { metadata: null })))).toBe('$0.05');
	});

	it('renders a fixed percentage charge as a percentage in the price table', () => {
		expect(getPriceTableCharge(percentagePrice('0.025', { type: PRICE_TYPE.FIXED }))).toBe('2.5%');
	});

	it('renders a usage percentage charge without the per-unit suffix in the price table', () => {
		expect(getPriceTableCharge(percentagePrice('0.05', { type: PRICE_TYPE.USAGE }))).toBe('5%');
	});

	it('ignores a stale marker once the charge is overridden onto another billing model', () => {
		const normalized = normalizePriceDisplay(percentagePrice('0.05'), {
			billing_model: BILLING_MODEL.PACKAGE,
			transform_quantity: { divide_by: 10 },
		} as never);
		expect(normalized.billingModel).toBe(BILLING_MODEL.PACKAGE);
		expect(formatPriceDisplay(normalized)).toBe('$0.05 / 10 units');
	});
});

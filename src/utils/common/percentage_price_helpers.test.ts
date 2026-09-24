import { describe, it, expect } from 'vitest';
import {
	PERCENTAGE_BILLING_MODEL,
	decimalAmountToPercentage,
	isPercentageMetadata,
	isPercentageOverride,
	isPercentagePrice,
	percentageToDecimalAmount,
	shiftDecimalString,
	withPercentageMetadata,
	withoutPercentageMetadata,
} from './percentage_price_helpers';
import { BILLING_MODEL } from '@/models/Price';

describe('percentageToDecimalAmount', () => {
	it('converts the percentages from the spec', () => {
		expect(percentageToDecimalAmount('5')).toBe('0.05');
		expect(percentageToDecimalAmount('10')).toBe('0.1');
		expect(percentageToDecimalAmount('2.5')).toBe('0.025');
	});

	it('is exact where floating-point division is not', () => {
		// 1.1 / 100 === 0.011000000000000001
		expect(percentageToDecimalAmount('1.1')).toBe('0.011');
		expect(percentageToDecimalAmount('0.07')).toBe('0.0007');
	});

	it('handles whole, zero and high percentages', () => {
		expect(percentageToDecimalAmount('100')).toBe('1');
		expect(percentageToDecimalAmount('0')).toBe('0');
		expect(percentageToDecimalAmount('150')).toBe('1.5');
	});

	it('returns an empty string for empty input', () => {
		expect(percentageToDecimalAmount('')).toBe('');
	});
});

describe('decimalAmountToPercentage', () => {
	it('converts the stored decimals from the spec back to percentages', () => {
		expect(decimalAmountToPercentage('0.05')).toBe('5');
		expect(decimalAmountToPercentage('0.10')).toBe('10');
		expect(decimalAmountToPercentage('0.025')).toBe('2.5');
	});

	it('round-trips values entered in the form', () => {
		for (const entered of ['5', '2.5', '1.1', '0.07', '99.99', '100']) {
			expect(decimalAmountToPercentage(percentageToDecimalAmount(entered))).toBe(Number(entered).toString());
		}
	});

	it('returns an empty string for empty input', () => {
		expect(decimalAmountToPercentage('')).toBe('');
	});
});

describe('shiftDecimalString', () => {
	it('leaves non-numeric input untouched rather than producing a bogus number', () => {
		expect(shiftDecimalString('abc', -2)).toBe('abc');
		expect(shiftDecimalString('.', -2)).toBe('.');
	});

	it('preserves the sign, except on zero', () => {
		expect(shiftDecimalString('-5', -2)).toBe('-0.05');
		expect(shiftDecimalString('-0', -2)).toBe('0');
	});
});

describe('isPercentageMetadata / isPercentagePrice', () => {
	it('detects the marker', () => {
		expect(isPercentageMetadata({ billing_model: 'percentage' })).toBe(true);
		expect(isPercentageMetadata({ billing_model: 'flat_fee' })).toBe(false);
		expect(isPercentageMetadata(null)).toBe(false);
		expect(isPercentageMetadata(undefined)).toBe(false);
	});

	it('only treats a flat fee as a percentage', () => {
		expect(isPercentagePrice({ billing_model: BILLING_MODEL.FLAT_FEE, metadata: { billing_model: 'percentage' } })).toBe(true);
		expect(isPercentagePrice({ metadata: { billing_model: 'percentage' } })).toBe(true);
	});

	it('ignores a stale marker on a charge that has moved to another billing model', () => {
		expect(isPercentagePrice({ billing_model: BILLING_MODEL.TIERED, metadata: { billing_model: 'percentage' } })).toBe(false);
		expect(isPercentagePrice({ billing_model: BILLING_MODEL.PACKAGE, metadata: { billing_model: 'percentage' } })).toBe(false);
	});
});

describe('isPercentageOverride', () => {
	const percentageFlatFee = { billing_model: BILLING_MODEL.FLAT_FEE, metadata: { billing_model: 'percentage' } };

	it('keeps a percentage charge percentage when the override leaves the billing model alone', () => {
		expect(isPercentageOverride(percentageFlatFee, { billing_model: BILLING_MODEL.FLAT_FEE })).toBe(true);
		expect(isPercentageOverride(percentageFlatFee, {})).toBe(true);
		expect(isPercentageOverride(percentageFlatFee, undefined)).toBe(true);
		expect(isPercentageOverride(percentageFlatFee, null)).toBe(true);
	});

	it('stops reading as a percentage once the override moves the charge off flat fee', () => {
		// The override's amount is then a plain currency amount - converting it would turn 10 into 1000%.
		expect(isPercentageOverride(percentageFlatFee, { billing_model: BILLING_MODEL.PACKAGE })).toBe(false);
		expect(isPercentageOverride(percentageFlatFee, { billing_model: BILLING_MODEL.TIERED })).toBe(false);
		expect(isPercentageOverride(percentageFlatFee, { billing_model: 'SLAB_TIERED' })).toBe(false);
	});

	it('never invents a percentage for a price that was never marked as one', () => {
		const plainFlatFee = { billing_model: BILLING_MODEL.FLAT_FEE, metadata: { source: 'import' } };
		expect(isPercentageOverride(plainFlatFee, { billing_model: BILLING_MODEL.FLAT_FEE })).toBe(false);
		expect(isPercentageOverride(plainFlatFee, undefined)).toBe(false);
	});

	it('agrees with isPercentagePrice when there is no override', () => {
		expect(isPercentageOverride(percentageFlatFee)).toBe(isPercentagePrice(percentageFlatFee));
		expect(isPercentageOverride({ billing_model: BILLING_MODEL.PACKAGE, metadata: { billing_model: 'percentage' } })).toBe(false);
	});
});

describe('withPercentageMetadata / withoutPercentageMetadata', () => {
	it('adds the marker while keeping unrelated keys', () => {
		expect(withPercentageMetadata({ source: 'import' })).toEqual({ source: 'import', billing_model: 'percentage' });
		expect(withPercentageMetadata(undefined)).toEqual({ billing_model: 'percentage' });
	});

	it('strips the marker and drops metadata that becomes empty', () => {
		expect(withoutPercentageMetadata({ billing_model: 'percentage' })).toBeUndefined();
		expect(withoutPercentageMetadata({ billing_model: 'percentage', source: 'import' })).toEqual({ source: 'import' });
		expect(withoutPercentageMetadata(undefined)).toBeUndefined();
	});

	it("leaves a caller's own billing_model value alone", () => {
		expect(withoutPercentageMetadata({ billing_model: 'something_else' })).toEqual({ billing_model: 'something_else' });
	});
});

describe('PERCENTAGE_BILLING_MODEL', () => {
	it('does not collide with a real backend billing model', () => {
		expect(Object.values(BILLING_MODEL)).not.toContain(PERCENTAGE_BILLING_MODEL as unknown as BILLING_MODEL);
	});
});

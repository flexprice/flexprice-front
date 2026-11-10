import { describe, expect, it } from 'vitest';
import { resolveQuantityFromInput } from '@/utils/subscription/quantityValidation';
import { isPriceCompatibleWithBillingPeriod } from './priceBillingPeriodCompatibility';
import { BILLING_PERIOD } from '@/constants/constants';

describe('resolveQuantityFromInput', () => {
	it('returns 0 when the input is "0" instead of falling back to minQuantity', () => {
		expect(resolveQuantityFromInput('0', 1)).toBe(0);
	});

	it('parses positive integers', () => {
		expect(resolveQuantityFromInput('5', 1)).toBe(5);
	});

	it('falls back to minQuantity when the input does not parse to a number', () => {
		expect(resolveQuantityFromInput('abc', 3)).toBe(3);
	});

	it('truncates decimal input the same way parseInt does', () => {
		expect(resolveQuantityFromInput('4.9', 1)).toBe(4);
	});
});

describe('isPriceCompatibleWithBillingPeriod', () => {
	it('keeps a one-time price regardless of the selected billing period', () => {
		const oneTimePrice = { billing_period: BILLING_PERIOD.ONETIME, billing_period_count: 1 };
		expect(isPriceCompatibleWithBillingPeriod(oneTimePrice, BILLING_PERIOD.MONTHLY, 1)).toBe(true);
		expect(isPriceCompatibleWithBillingPeriod(oneTimePrice, BILLING_PERIOD.ANNUAL, 1)).toBe(true);
	});

	it('keeps a recurring price whose cadence matches the subscription cadence', () => {
		const monthlyPrice = { billing_period: BILLING_PERIOD.MONTHLY, billing_period_count: 1 };
		expect(isPriceCompatibleWithBillingPeriod(monthlyPrice, BILLING_PERIOD.MONTHLY, 1)).toBe(true);
	});

	it('drops a recurring price whose cadence does not divide the subscription cadence', () => {
		const quarterlyPrice = { billing_period: BILLING_PERIOD.QUARTERLY, billing_period_count: 1 };
		expect(isPriceCompatibleWithBillingPeriod(quarterlyPrice, BILLING_PERIOD.MONTHLY, 1)).toBe(false);
	});

	it('keeps a recurring price whose cadence evenly divides a multi-count subscription cadence', () => {
		const monthlyPrice = { billing_period: BILLING_PERIOD.MONTHLY, billing_period_count: 1 };
		expect(isPriceCompatibleWithBillingPeriod(monthlyPrice, BILLING_PERIOD.QUARTERLY, 1)).toBe(true);
	});
});

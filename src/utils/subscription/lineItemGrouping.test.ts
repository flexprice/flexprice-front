import { describe, expect, it } from 'vitest';
import { BILLING_PERIOD } from '@/constants/constants';
import { chargeSplitsAcrossBillingPeriod, subscriptionHasSplittingCharge } from './lineItemGrouping';

const charge = (billing_period: BILLING_PERIOD | string, billing_period_count?: number) => ({ billing_period, billing_period_count });

describe('chargeSplitsAcrossBillingPeriod', () => {
	it('splits when the charge cadence strictly divides the subscription cadence', () => {
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.QUARTERLY, 1, charge(BILLING_PERIOD.MONTHLY, 1))).toBe(true);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.ANNUAL, 1, charge(BILLING_PERIOD.QUARTERLY, 1))).toBe(true);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.ANNUAL, 1, charge(BILLING_PERIOD.MONTHLY, 1))).toBe(true);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.HALF_YEARLY, 1, charge(BILLING_PERIOD.MONTHLY, 2))).toBe(true);
	});

	it('does not split on equal cadence', () => {
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.MONTHLY, 1, charge(BILLING_PERIOD.MONTHLY, 1))).toBe(false);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.QUARTERLY, 2, charge(BILLING_PERIOD.QUARTERLY, 2))).toBe(false);
		// Same effective months via a different (period, count) pair is still one window.
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.QUARTERLY, 1, charge(BILLING_PERIOD.MONTHLY, 3))).toBe(false);
	});

	it('does not split when the charge cadence is longer or non-dividing', () => {
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.MONTHLY, 1, charge(BILLING_PERIOD.ANNUAL, 1))).toBe(false);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.HALF_YEARLY, 1, charge(BILLING_PERIOD.QUARTERLY, 2))).toBe(false);
	});

	it('never splits ONETIME, DAILY or WEEKLY charges', () => {
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.QUARTERLY, 1, charge(BILLING_PERIOD.ONETIME, 1))).toBe(false);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.QUARTERLY, 1, charge(BILLING_PERIOD.DAILY, 1))).toBe(false);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.QUARTERLY, 1, charge(BILLING_PERIOD.WEEKLY, 1))).toBe(false);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.WEEKLY, 4, charge(BILLING_PERIOD.WEEKLY, 1))).toBe(false);
	});

	it('never splits when the subscription itself is daily / weekly / onetime', () => {
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.DAILY, 1, charge(BILLING_PERIOD.MONTHLY, 1))).toBe(false);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.WEEKLY, 1, charge(BILLING_PERIOD.DAILY, 1))).toBe(false);
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.ONETIME, 1, charge(BILLING_PERIOD.MONTHLY, 1))).toBe(false);
	});

	it('treats missing / zero counts as 1 and accepts lower-case periods', () => {
		expect(chargeSplitsAcrossBillingPeriod(BILLING_PERIOD.QUARTERLY, undefined, charge(BILLING_PERIOD.MONTHLY))).toBe(true);
		expect(chargeSplitsAcrossBillingPeriod('quarterly', 0, charge('monthly', 0))).toBe(true);
	});
});

describe('subscriptionHasSplittingCharge', () => {
	it('is false for an empty charge list', () => {
		expect(subscriptionHasSplittingCharge(BILLING_PERIOD.QUARTERLY, 1, [])).toBe(false);
	});

	it('is true when at least one attached charge splits', () => {
		const charges = [charge(BILLING_PERIOD.QUARTERLY, 1), charge(BILLING_PERIOD.ONETIME, 1), charge(BILLING_PERIOD.MONTHLY, 1)];
		expect(subscriptionHasSplittingCharge(BILLING_PERIOD.QUARTERLY, 1, charges)).toBe(true);
	});

	it('is false when every attached charge matches or exceeds the subscription cadence', () => {
		const charges = [charge(BILLING_PERIOD.QUARTERLY, 1), charge(BILLING_PERIOD.ONETIME, 1), charge(BILLING_PERIOD.ANNUAL, 1)];
		expect(subscriptionHasSplittingCharge(BILLING_PERIOD.QUARTERLY, 1, charges)).toBe(false);
	});
});

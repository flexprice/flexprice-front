import { BILLING_PERIOD } from '@/constants/constants';
import { calculateCalendarBillingAnchor } from '@/utils/helpers/subscription';
import { describe, test, expect } from 'vitest';

describe('Billing Anchor Calculations', () => {
	const testCases = [
		{
			name: 'Daily Billing - Start of Day',
			startDate: new Date('2024-01-15T00:00:00Z'),
			billingPeriod: BILLING_PERIOD.DAILY,
			expectedAnchor: new Date('2024-01-16T00:00:00Z'),
		},
		{
			name: 'Daily Billing - Mid Day',
			startDate: new Date('2024-01-15T12:30:45Z'),
			billingPeriod: BILLING_PERIOD.DAILY,
			expectedAnchor: new Date('2024-01-16T00:00:00Z'),
		},
		{
			name: 'Weekly Billing - Mid Week',
			startDate: new Date('2024-01-15T12:30:45Z'), // Monday
			billingPeriod: BILLING_PERIOD.WEEKLY,
			expectedAnchor: new Date('2024-01-22T00:00:00Z'), // Next Monday
		},
		{
			name: 'Weekly Billing - End of Week',
			startDate: new Date('2024-01-21T23:59:59Z'), // Sunday
			billingPeriod: BILLING_PERIOD.WEEKLY,
			expectedAnchor: new Date('2024-01-22T00:00:00Z'), // Next Monday
		},
		{
			name: 'Monthly Billing - Mid Month',
			startDate: new Date('2024-01-15T12:30:45Z'),
			billingPeriod: BILLING_PERIOD.MONTHLY,
			expectedAnchor: new Date('2024-02-01T00:00:00Z'),
		},
		{
			name: 'Monthly Billing - End of Month',
			startDate: new Date('2024-01-31T23:59:59Z'),
			billingPeriod: BILLING_PERIOD.MONTHLY,
			expectedAnchor: new Date('2024-02-01T00:00:00Z'),
		},
		{
			name: 'Quarterly Billing - Mid Quarter',
			startDate: new Date('2024-02-15T12:30:45Z'),
			billingPeriod: BILLING_PERIOD.QUARTERLY,
			expectedAnchor: new Date('2024-04-01T00:00:00Z'),
		},
		{
			name: 'Quarterly Billing - End of Quarter',
			startDate: new Date('2024-03-31T23:59:59Z'),
			billingPeriod: BILLING_PERIOD.QUARTERLY,
			expectedAnchor: new Date('2024-04-01T00:00:00Z'),
		},
		{
			name: 'Half-Yearly Billing - Mid Year',
			startDate: new Date('2024-03-15T12:30:45Z'),
			billingPeriod: BILLING_PERIOD.HALF_YEARLY,
			expectedAnchor: new Date('2024-07-01T00:00:00Z'),
		},
		{
			name: 'Annual Billing - Mid Year',
			startDate: new Date('2024-06-15T12:30:45Z'),
			billingPeriod: BILLING_PERIOD.ANNUAL,
			expectedAnchor: new Date('2025-01-01T00:00:00Z'),
		},
		{
			name: 'Leap Year Annual Billing',
			startDate: new Date('2024-02-29T12:30:45Z'),
			billingPeriod: BILLING_PERIOD.ANNUAL,
			expectedAnchor: new Date('2025-01-01T00:00:00Z'),
		},
	];

	testCases.forEach(({ name, startDate, billingPeriod, expectedAnchor }) => {
		test(name, () => {
			const result = calculateCalendarBillingAnchor(startDate, billingPeriod);
			expect(result.toUTCString()).toBe(expectedAnchor.toUTCString());
		});
	});

	test('Default Case - Unsupported Billing Period', () => {
		const startDate = new Date('2024-01-15T12:30:45Z');
		const unsupportedPeriod = 999 as unknown as BILLING_PERIOD;
		const result = calculateCalendarBillingAnchor(startDate, unsupportedPeriod);
		console.log('Default Case - Unsupported Billing Period result:', result);
		expect(result).toEqual(startDate);
	});
});

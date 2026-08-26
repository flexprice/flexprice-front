import { describe, expect, it } from 'vitest';
import { ENTITY_STATUS, Plan } from '@/models';
import { BILLING_PERIOD } from '@/constants/constants';
import { getPlanBillingPeriodLabel, getPlanCurrencyLabel, getPlanListStatus } from './planListDisplay';

const empty = '—';

const plan = (overrides: Partial<Plan> = {}): Plan =>
	({
		id: 'plan_1',
		name: 'Starter',
		lookup_key: 'starter',
		description: '',
		status: ENTITY_STATUS.PUBLISHED,
		created_at: '',
		updated_at: '',
		created_by: '',
		updated_by: '',
		tenant_id: '',
		environment_id: '',
		...overrides,
	}) as Plan;

describe('planListDisplay', () => {
	it('joins unique billing periods in canonical order', () => {
		const result = getPlanBillingPeriodLabel(
			plan({
				prices: [
					{ billing_period: BILLING_PERIOD.ANNUAL, currency: 'usd' },
					{ billing_period: BILLING_PERIOD.MONTHLY, currency: 'usd' },
				] as Plan['prices'],
			}),
			empty,
		);
		expect(result).toBe('Monthly, Yearly');
	});

	it('returns the empty label when a plan has no prices', () => {
		expect(getPlanBillingPeriodLabel(plan(), empty)).toBe(empty);
		expect(getPlanCurrencyLabel(plan(), empty)).toBe(empty);
	});

	it('uppercases unique currencies', () => {
		expect(
			getPlanCurrencyLabel(
				plan({
					prices: [
						{ billing_period: BILLING_PERIOD.MONTHLY, currency: 'usd' },
						{ billing_period: BILLING_PERIOD.MONTHLY, currency: 'eur' },
					] as Plan['prices'],
				}),
				empty,
			),
		).toBe('USD, EUR');
	});

	it('maps published plans to Active and archived plans to Inactive', () => {
		expect(getPlanListStatus(plan({ status: ENTITY_STATUS.PUBLISHED }))).toBe('Active');
		expect(getPlanListStatus(plan({ status: ENTITY_STATUS.ARCHIVED }))).toBe('Inactive');
	});
});

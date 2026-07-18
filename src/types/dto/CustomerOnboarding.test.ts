import { describe, it, expect } from 'vitest';
import { BILLING_CYCLE } from '@/models/Subscription';
import { DEFAULT_CUSTOMER_ONBOARDING_CONFIG, parseCustomerOnboardingConfig } from './CustomerOnboarding';

describe('parseCustomerOnboardingConfig', () => {
	it('returns the default config for non-object input', () => {
		expect(parseCustomerOnboardingConfig(null)).toEqual(DEFAULT_CUSTOMER_ONBOARDING_CONFIG);
		expect(parseCustomerOnboardingConfig(undefined)).toEqual(DEFAULT_CUSTOMER_ONBOARDING_CONFIG);
		expect(parseCustomerOnboardingConfig('nope')).toEqual(DEFAULT_CUSTOMER_ONBOARDING_CONFIG);
	});

	it('parses a create_wallet action, defaulting missing/optional fields', () => {
		const result = parseCustomerOnboardingConfig({
			actions: [{ action: 'create_wallet', currency: 123 }],
		});
		expect(result.actions).toEqual([{ action: 'create_wallet', currency: '123' }]);
	});

	it('keeps conversion_rate only when present', () => {
		const result = parseCustomerOnboardingConfig({
			actions: [{ action: 'create_wallet', currency: 'USD', conversion_rate: '1.5' }],
		});
		expect(result.actions).toEqual([{ action: 'create_wallet', currency: 'USD', conversion_rate: '1.5' }]);
	});

	it('parses a create_subscription action and drops an invalid billing_cycle', () => {
		const result = parseCustomerOnboardingConfig({
			actions: [{ action: 'create_subscription', plan_id: 'plan_1', billing_cycle: 'not-a-real-cycle' }],
		});
		expect(result.actions).toEqual([{ action: 'create_subscription', plan_id: 'plan_1' }]);
	});

	it('keeps a valid billing_cycle', () => {
		const result = parseCustomerOnboardingConfig({
			actions: [{ action: 'create_subscription', plan_id: 'plan_1', billing_cycle: BILLING_CYCLE.CALENDAR }],
		});
		expect(result.actions).toEqual([{ action: 'create_subscription', plan_id: 'plan_1', billing_cycle: BILLING_CYCLE.CALENDAR }]);
	});

	it('passes through unrecognized action types with their extra fields intact', () => {
		const result = parseCustomerOnboardingConfig({
			actions: [{ action: 'create_customer', foo: 'bar' }],
		});
		expect(result.actions).toEqual([{ action: 'create_customer', foo: 'bar' }]);
	});

	it('drops malformed action entries (missing action field)', () => {
		const result = parseCustomerOnboardingConfig({
			actions: [{ notAnAction: true }, { action: 'create_wallet', currency: 'EUR' }],
		});
		expect(result.actions).toEqual([{ action: 'create_wallet', currency: 'EUR' }]);
	});
});

import { describe, expect, it } from 'vitest';
import { toCreateEntitlementRequest } from './entitlementRequest';
import { patchForMode } from './allowanceMode';
import { ENTITLEMENT_ENTITY_TYPE, ENTITLEMENT_GRANT_DURATION_UNIT, ENTITLEMENT_GRANT_MEASURE } from '@/models/Entitlement';
import { FEATURE_TYPE } from '@/models/Feature';

const target = { planId: 'plan_1', entityType: ENTITLEMENT_ENTITY_TYPE.PLAN, entityId: 'plan_1' };
const metered = { feature_id: 'feat_1', feature_type: FEATURE_TYPE.METERED, is_enabled: true };

describe('toCreateEntitlementRequest', () => {
	it('carries grant config for a recurring allowance', () => {
		// Dropping these fields is what silently created every metered entitlement
		// as unlimited: no grant config plus no usage_limit reads as "no ceiling".
		const draft = { ...metered, ...patchForMode('recurring', {}), grant_quota: '1000' };
		const req = toCreateEntitlementRequest(draft, target);

		expect(req.grant_quota).toBe('1000');
		expect(req.grant_duration_value).toBe(1);
		expect(req.grant_duration_unit).toBe(ENTITLEMENT_GRANT_DURATION_UNIT.DAY);
		expect(req.grant_measure).toBe(ENTITLEMENT_GRANT_MEASURE.QUANTITY);
		expect(req.grant_allocation_behavior).toBeDefined();
		expect(req.aggregation_mode).toBeDefined();
	});

	it('carries a billing-period allowance without a duration value', () => {
		const draft = { ...metered, ...patchForMode('period', {}), grant_quota: '500' };
		const req = toCreateEntitlementRequest(draft, target);

		expect(req.grant_quota).toBe('500');
		expect(req.grant_duration_unit).toBe(ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD);
		expect(req.grant_duration_value).toBeUndefined();
		expect(req.grant_allocation_behavior).toBeUndefined();
	});

	it('omits grant_quota entirely for unlimited', () => {
		const req = toCreateEntitlementRequest({ ...metered, ...patchForMode('unlimited', {}) }, target);
		expect(req.grant_quota).toBeUndefined();
		expect(req.grant_duration_unit).toBe(ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD);
	});

	it('never sends legacy quota fields for a metered feature', () => {
		const draft = { ...metered, ...patchForMode('recurring', {}), grant_quota: '1000' };
		const req = toCreateEntitlementRequest(draft, target) as unknown as Record<string, unknown>;

		expect(req.usage_limit).toBeUndefined();
		expect(req.usage_reset_period).toBeUndefined();
		expect(req.is_soft_limit).toBeUndefined();
	});

	it('leaves non-metered features untouched', () => {
		const req = toCreateEntitlementRequest(
			{ feature_id: 'feat_2', feature_type: FEATURE_TYPE.STATIC, static_value: 'Priority' },
			target,
		) as unknown as Record<string, unknown>;

		expect(req.static_value).toBe('Priority');
		expect(req.grant_measure).toBeUndefined();
		expect(req.grant_duration_unit).toBeUndefined();
	});
});

describe('partial grant config', () => {
	it('fills the measure a user never touched', () => {
		// The form shows "units" as the default but only writes it to state when the
		// dropdown is used. Sending quota + duration with no measure is rejected as
		// an incomplete grant config.
		const req = toCreateEntitlementRequest(
			{
				feature_id: 'feat_1',
				feature_type: FEATURE_TYPE.METERED,
				grant_quota: '1000',
				grant_duration_value: 1,
				grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
			},
			target,
		);

		expect(req.grant_measure).toBe(ENTITLEMENT_GRANT_MEASURE.QUANTITY);
		expect(req.aggregation_mode).toBeDefined();
	});
});

import { describe, expect, it } from 'vitest';
import { formatAllowanceValue, formatAllowanceReset } from './allowanceLabel';
import { ENTITLEMENT_GRANT_DURATION_UNIT, ENTITLEMENT_GRANT_MEASURE, ENTITLEMENT_USAGE_RESET_PERIOD } from '@/models/Entitlement';
import { FEATURE_TYPE } from '@/models/Feature';

const t = ((key: string) => key) as never;
const feature = { unit_plural: 'calls' };

describe('formatAllowanceValue', () => {
	it('shows a grant quota with the feature unit', () => {
		expect(
			formatAllowanceValue(
				{
					feature_type: FEATURE_TYPE.METERED,
					feature,
					grant_quota: '1000',
					grant_measure: ENTITLEMENT_GRANT_MEASURE.QUANTITY,
					grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
				} as never,
				t,
			),
		).toBe('1,000 calls');
	});

	it('shows unlimited for a grant with no ceiling and for a legacy null limit', () => {
		const unlimitedGrant = {
			feature_type: FEATURE_TYPE.METERED,
			grant_measure: ENTITLEMENT_GRANT_MEASURE.QUANTITY,
			grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD,
		};
		expect(formatAllowanceValue(unlimitedGrant as never, t)).toBe('entitlements.allowance.unlimited');
		expect(formatAllowanceValue({ feature_type: FEATURE_TYPE.METERED, usage_limit: null } as never, t)).toBe(
			'entitlements.allowance.unlimited',
		);
	});
});

describe('formatAllowanceReset', () => {
	it('renders a multi-unit grant cadence', () => {
		expect(
			formatAllowanceReset(
				{
					feature_type: FEATURE_TYPE.METERED,
					grant_quota: '1000',
					grant_duration_value: 5,
					grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
				} as never,
				t,
			),
		).toBe('5 entitlements.addDrawer.durationDays');
	});

	it('has nothing to reset when unlimited', () => {
		expect(
			formatAllowanceReset(
				{
					feature_type: FEATURE_TYPE.METERED,
					grant_measure: ENTITLEMENT_GRANT_MEASURE.QUANTITY,
					grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD,
				} as never,
				t,
			),
		).toBe('--');
	});

	it('falls back to the legacy reset period', () => {
		expect(
			formatAllowanceReset(
				{ feature_type: FEATURE_TYPE.METERED, usage_limit: 100, usage_reset_period: ENTITLEMENT_USAGE_RESET_PERIOD.MONTHLY } as never,
				t,
			),
		).toBe('monthly');
	});
});

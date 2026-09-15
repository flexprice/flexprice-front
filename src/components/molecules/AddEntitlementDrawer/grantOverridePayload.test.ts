import { describe, expect, it } from 'vitest';
import { toGrantOverrideFields } from './grantOverridePayload';
import { patchForMode } from './allowanceMode';
import { ENTITLEMENT_GRANT_DURATION_UNIT, ENTITLEMENT_GRANT_MEASURE } from '@/models/Entitlement';

describe('toGrantOverrideFields', () => {
	it('sends the allowance and never a usage_limit', () => {
		const fields = toGrantOverrideFields({ ...patchForMode('recurring', {}), grant_quota: '1000' });
		expect(fields).not.toBeNull();
		expect(fields).toMatchObject({
			grant_quota: '1000',
			grant_measure: ENTITLEMENT_GRANT_MEASURE.QUANTITY,
			grant_duration_unit: ENTITLEMENT_GRANT_DURATION_UNIT.DAY,
		});
		expect(fields).not.toHaveProperty('usage_limit');
		expect(fields?.grant_unlimited).toBeUndefined();
	});

	it('states unlimited explicitly and drops the quota', () => {
		const fields = toGrantOverrideFields(patchForMode('unlimited', {}));
		expect(fields?.grant_unlimited).toBe(true);
		expect(fields?.grant_quota).toBeUndefined();
	});

	// The server treats ANY grant field as "this row is grant-backed", so half a
	// config is rejected outright — better to catch it on the form.
	it('refuses a bounded allowance with no value typed', () => {
		expect(toGrantOverrideFields(patchForMode('recurring', {}))).toBeNull();
		expect(toGrantOverrideFields({ ...patchForMode('period', {}), grant_quota: '' })).toBeNull();
	});
});

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MeteredAllowanceFields from './MeteredAllowanceFields';
import { deriveAllowanceMode, patchForMode } from './allowanceMode';
import { ENTITLEMENT_GRANT_DURATION_UNIT } from '@/models/Entitlement';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

describe('MeteredAllowanceFields', () => {
	it('renders a numeric duration without throwing', () => {
		// Input formats its value as a string and casts internally, so passing a raw
		// number reaches `.startsWith` and crashes the page at runtime.
		const value = patchForMode('recurring', {});
		expect(typeof value.grant_duration_value).toBe('number');

		expect(() => render(<MeteredAllowanceFields value={value} onChange={vi.fn()} unitLabel='calls' />)).not.toThrow();
	});
});

describe('allowanceMode', () => {
	it('treats a cycle-length window with no quota as unlimited', () => {
		expect(deriveAllowanceMode(patchForMode('unlimited', {}))).toBe('unlimited');
		expect(deriveAllowanceMode(patchForMode('period', { grant_quota: '100' }))).toBe('period');
		expect(deriveAllowanceMode(patchForMode('recurring', {}))).toBe('recurring');
	});

	it('clears legacy fields and half-set combinations when switching modes', () => {
		const recurring = patchForMode('recurring', { usage_limit: 500 });
		expect(recurring.usage_limit).toBeUndefined();
		expect(recurring.usage_reset_period).toBeUndefined();

		// A cycle-length window derives its length from the subscription, so it must
		// carry neither a duration value nor an anchor.
		const period = patchForMode('period', recurring);
		expect(period.grant_duration_value).toBeUndefined();
		expect(period.grant_allocation_behavior).toBeUndefined();
		expect(period.grant_duration_unit).toBe(ENTITLEMENT_GRANT_DURATION_UNIT.SUBSCRIPTION_PERIOD);

		const unlimited = patchForMode('unlimited', period);
		expect(unlimited.grant_quota).toBeNull();
	});
});

describe('billing-period vs unlimited', () => {
	it('an empty billing-period allowance is not unlimited', () => {
		// `undefined` means "not typed yet"; only an explicit null means unlimited.
		// Conflating them flipped the radio to Unlimited on selection and submitted
		// an unlimited entitlement.
		const period = patchForMode('period', {});
		expect(period.grant_quota).toBeUndefined();
		expect(deriveAllowanceMode(period)).toBe('period');

		const filled = { ...period, grant_quota: '1000' };
		expect(deriveAllowanceMode(filled)).toBe('period');

		expect(deriveAllowanceMode(patchForMode('unlimited', filled))).toBe('unlimited');
	});

	it('keeps the typed quota when switching between bounded modes', () => {
		const recurring = { ...patchForMode('recurring', {}), grant_quota: '250' };
		expect(patchForMode('period', recurring).grant_quota).toBe('250');
		expect(patchForMode('recurring', patchForMode('period', recurring)).grant_quota).toBe('250');
	});
});

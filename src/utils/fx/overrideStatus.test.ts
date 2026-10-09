import { describe, expect, it } from 'vitest';
import { getOverrideStatus } from './overrideStatus';

const now = new Date('2026-06-15T00:00:00Z');

describe('getOverrideStatus', () => {
	it('is active when the window covers now', () => {
		expect(getOverrideStatus('2026-06-01T00:00:00Z', '2026-07-01T00:00:00Z', now)).toBe('active');
	});
	it('treats the end as exclusive', () => {
		expect(getOverrideStatus(null, '2026-06-15T00:00:00Z', now)).toBe('expired');
	});
});

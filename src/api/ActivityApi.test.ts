import { describe, expect, it } from 'vitest';
import { toQueryString } from './ActivityApi';

describe('toQueryString', () => {
	it('serializes scalars, arrays and dates, omits undefined', () => {
		const qs = toQueryString({
			entity_type: 'subscription',
			entity_id: 'subs_1',
			actions: ['subscription.paused', 'subscription.resumed'],
			start_time: '2026-09-03T00:00:00Z',
			cursor: undefined,
			limit: 25,
		});
		expect(qs).toBe(
			'entity_type=subscription&entity_id=subs_1&actions=subscription.paused&actions=subscription.resumed&start_time=2026-09-03T00%3A00%3A00Z&limit=25',
		);
	});
	it('returns empty string for empty query', () => {
		expect(toQueryString({})).toBe('');
	});
});

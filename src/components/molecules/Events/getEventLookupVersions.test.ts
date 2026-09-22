import { describe, expect, it } from 'vitest';
import { ENTITY_STATUS } from '@/models';
import { Event } from '@/models/Event';
import { EventLookupItem } from '@/types/dto';
import { getEventLookupVersions } from './getEventLookupVersions';

const fallbackEvent: Event = {
	id: 'evt_fallback',
	external_customer_id: 'cust_ext',
	customer_id: 'cust_1',
	event_name: 'pageviews',
	timestamp: '2026-08-31T00:00:00Z',
	ingested_at: '2026-09-14T03:52:16Z',
	properties: { value: 4975355 },
	source: 'publicapi',
	environment_id: 'env_1',
	created_at: '2026-09-14T03:52:16Z',
	updated_at: '2026-09-14T03:52:16Z',
	created_by: 'test',
	updated_by: 'test',
	tenant_id: 'tenant_1',
	status: ENTITY_STATUS.PUBLISHED,
};

const latestRow: EventLookupItem = {
	id: 'evt_dup',
	external_customer_id: 'cust_ext',
	customer_id: 'cust_1',
	event_name: 'pageviews',
	timestamp: '2026-08-31T00:00:00Z',
	ingested_at: '2026-09-14T03:52:16Z',
	properties: { credits: 4975355 },
	source: 'publicapi',
	environment_id: 'env_1',
};

const earlierRow: EventLookupItem = {
	...latestRow,
	ingested_at: '2026-09-14T03:52:14Z',
	properties: { credits: 0 },
};

describe('getEventLookupVersions', () => {
	it('uses events[] when present and keeps backend newest-first order', () => {
		const versions = getEventLookupVersions([latestRow, earlierRow], fallbackEvent);

		expect(versions).toEqual([latestRow, earlierRow]);
		expect(versions[0]?.ingested_at).toBe('2026-09-14T03:52:16Z');
		expect(versions[1]?.ingested_at).toBe('2026-09-14T03:52:14Z');
	});

	it('falls back to the legacy top-level event when events is missing', () => {
		const versions = getEventLookupVersions(undefined, fallbackEvent);

		expect(versions).toHaveLength(1);
		expect(versions[0]?.id).toBe('evt_fallback');
		expect(versions[0]?.properties).toEqual({ value: 4975355 });
		expect(versions[0]?.ingested_at).toBe('2026-09-14T03:52:16Z');
	});

	it('falls back to the legacy top-level event when events is empty', () => {
		const versions = getEventLookupVersions([], fallbackEvent);

		expect(versions).toHaveLength(1);
		expect(versions[0]?.id).toBe('evt_fallback');
	});

	it('returns an empty list when both events[] and event are missing', () => {
		expect(getEventLookupVersions(undefined, null)).toEqual([]);
		expect(getEventLookupVersions([], undefined)).toEqual([]);
	});
});

import { describe, it, expect } from 'vitest';
import { buildMeterRequest, sanitizeMeterFilters } from './AddFeature.utils';
import { METER_AGGREGATION_TYPE, METER_USAGE_RESET_PERIOD } from '@/models/Meter';

describe('sanitizeMeterFilters', () => {
	it('trims leading/trailing whitespace from keys and values', () => {
		const result = sanitizeMeterFilters([{ key: '  region  ', values: ['  us  ', ' eu'] }]);
		expect(result).toEqual([{ key: 'region', values: ['us', 'eu'] }]);
	});

	it('drops filters whose key is only whitespace', () => {
		const result = sanitizeMeterFilters([{ key: '   ', values: ['us'] }]);
		expect(result).toEqual([]);
	});

	it('drops filters with no remaining values after trimming', () => {
		const result = sanitizeMeterFilters([{ key: 'region', values: ['   '] }]);
		expect(result).toEqual([]);
	});

	it('returns an empty array for undefined input', () => {
		expect(sanitizeMeterFilters(undefined)).toEqual([]);
	});
});

describe('buildMeterRequest', () => {
	it('returns undefined when no meter is provided', () => {
		expect(buildMeterRequest(undefined, 'fallback')).toBeUndefined();
	});

	it('trims the event name', () => {
		const result = buildMeterRequest(
			{
				event_name: '  api.request  ',
				aggregation: { type: METER_AGGREGATION_TYPE.COUNT },
			},
			'Feature Name',
		);
		expect(result?.event_name).toBe('api.request');
	});

	it('trims the aggregation field', () => {
		const result = buildMeterRequest(
			{
				event_name: 'api.request',
				aggregation: { type: METER_AGGREGATION_TYPE.SUM, field: '  tokens  ' },
			},
			'Feature Name',
		);
		expect(result?.aggregation.field).toBe('tokens');
	});

	it('trims the custom expression', () => {
		const result = buildMeterRequest(
			{
				event_name: 'api.request',
				aggregation: { type: METER_AGGREGATION_TYPE.SUM, expression: '  tokens * 2  ' },
			},
			'Feature Name',
		);
		expect(result?.aggregation.expression).toBe('tokens * 2');
		expect(result?.aggregation.field).toBeUndefined();
	});

	it('trims event filter keys and values and drops blank-only filters', () => {
		const result = buildMeterRequest(
			{
				event_name: 'api.request',
				aggregation: { type: METER_AGGREGATION_TYPE.COUNT },
				filters: [
					{ key: '  region  ', values: [' us ', 'eu  '] },
					{ key: '   ', values: ['ignored'] },
				],
			},
			'Feature Name',
		);
		expect(result?.filters).toEqual([{ key: 'region', values: ['us', 'eu'] }]);
	});

	it('falls back to the feature name when the meter has none', () => {
		const result = buildMeterRequest(
			{
				event_name: 'api.request',
				aggregation: { type: METER_AGGREGATION_TYPE.COUNT },
			},
			'Feature Name',
		);
		expect(result?.name).toBe('Feature Name');
		expect(result?.reset_usage).toBe(METER_USAGE_RESET_PERIOD.BILLING_PERIOD);
	});
});

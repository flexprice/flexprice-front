import { describe, it, expect } from 'vitest';
import { ReportCatalogEntry, ReportQueryResult } from '@/types/dto/Reports';
import {
	buildRequest,
	controlsForEntry,
	currenciesOf,
	defaultControls,
	deltaDisplay,
	formatValue,
	inclusiveEnd,
	isBucketInProgress,
	isToDatePreset,
	presetAllowed,
	rangeForPreset,
	toSeries,
	totalsFor,
} from './reportMath';

const NOW = new Date(Date.UTC(2026, 9, 12, 15, 0, 0));

const flow: ReportCatalogEntry = {
	key: 'invoice_total',
	name: 'Total billing',
	description: '',
	category: 'billing',
	kind: 'flow',
	value_type: 'money',
	improvement: 'higher',
	shapes: ['scalar', 'timeseries', 'breakdown'],
	default_shape: 'timeseries',
	dimensions: [{ key: 'customer_id', label: 'Customer' }],
	grains: ['day', 'week', 'month'],
	supports_compare: true,
};
const snapshot: ReportCatalogEntry = {
	...flow,
	key: 'total_receivables',
	kind: 'snapshot',
	shapes: ['scalar'],
	default_shape: 'scalar',
	dimensions: [],
	grains: [],
	supports_compare: false,
};

const result: ReportQueryResult = {
	columns: [
		{ name: 'bucket', type: 'datetime', role: 'dimension' },
		{ name: 'currency', type: 'string', role: 'dimension' },
		{ name: 'invoice_total', type: 'decimal', role: 'metric' },
		{ name: 'invoice_total_prev', type: 'decimal', role: 'metric' },
		{ name: 'invoice_total_change_pct', type: 'decimal', role: 'metric' },
	],
	rows: [
		['2026-08-01T00:00:00Z', 'usd', '100', '80', '25'],
		['2026-08-01T00:00:00Z', 'eur', '999', '1', '99800'],
		['2026-09-01T00:00:00Z', 'usd', '150', '100', '50'],
	],
	meta: { query_source: 'billing' },
};

describe('rangeForPreset', () => {
	it('computes UTC, end-exclusive ranges through yesterday', () => {
		expect(rangeForPreset('this_month', NOW)).toBe('2026-10-01..2026-10-12');
		expect(rangeForPreset('last_month', NOW)).toBe('2026-09-01..2026-10-01');
		expect(rangeForPreset('this_quarter', NOW)).toBe('2026-10-01..2026-10-12');
		expect(rangeForPreset('this_year', NOW)).toBe('2026-01-01..2026-10-12');
		expect(rangeForPreset('last_30_days', NOW)).toBe('2026-09-12..2026-10-12');
	});

	it('keeps today when the period starts today', () => {
		const first = new Date(Date.UTC(2026, 9, 1, 15));
		expect(rangeForPreset('this_month', first)).toBe('2026-10-01..2026-10-02');
		expect(rangeForPreset('last_7_days', first)).toBe('2026-09-24..2026-10-01');
	});
});

describe('buildRequest', () => {
	it('timeseries flow with compare', () => {
		const c = { ...defaultControls(flow), preset: 'last_month' as const, grain: 'month' as const, compare: 'previous_period' as const };
		expect(buildRequest(flow, c, NOW)).toEqual({
			shape: 'timeseries',
			range: '2026-09-01..2026-10-01',
			grain: 'month',
			compare: 'previous_period',
		});
	});
	it('group-by switches to breakdown and drops grain', () => {
		const c = { ...defaultControls(flow), groupBy: 'customer_id' };
		const req = buildRequest(flow, c, NOW);
		expect(req.shape).toBe('breakdown');
		expect(req.dimensions).toEqual(['customer_id']);
		expect(req.grain).toBeUndefined();
	});
	it('snapshot never sends grain or compare', () => {
		const c = { ...defaultControls(snapshot), compare: 'previous_period' as const, grain: 'month' as const };
		const req = buildRequest(snapshot, c, NOW);
		expect(req).toEqual({ shape: 'scalar', range: rangeForPreset(c.preset, NOW) });
	});
	it('never sends currency', () => {
		expect(buildRequest(flow, { ...defaultControls(flow), currency: 'usd' }, NOW)).not.toHaveProperty('currency');
		expect(buildRequest(flow, { ...defaultControls(flow), currency: '' }, NOW)).not.toHaveProperty('currency');
	});
});

describe('controlsForEntry', () => {
	it('resets a group-by the new report does not allow', () => {
		const prev = { ...defaultControls(flow), groupBy: 'customer_id', preset: 'this_year' as const };
		const next = controlsForEntry(snapshot, prev);
		expect(next.groupBy).toBe('');
		expect(next.grain).toBe('');
		expect(next.preset).toBe('this_year');
	});
	it('keeps compare none when the user chose it', () => {
		const prev = { ...defaultControls(flow), compare: 'none' as const };
		expect(controlsForEntry(flow, prev).compare).toBe('none');
		expect(controlsForEntry(snapshot, prev).compare).toBe('none');
	});
});

describe('max_range_days', () => {
	const capped = { ...flow, key: 'events_volume', max_range_days: 7 };
	it('allows only presets within the cap', () => {
		expect(presetAllowed(capped, 'last_7_days')).toBe(true);
		for (const p of ['last_30_days', 'last_90_days', 'this_month', 'last_month', 'this_quarter', 'this_year'] as const) {
			expect(presetAllowed(capped, p)).toBe(false);
		}
		expect(presetAllowed(flow, 'this_year')).toBe(true);
	});
	it('defaults to the largest allowed preset', () => {
		expect(defaultControls(flow).preset).toBe('last_90_days');
		expect(defaultControls(capped).preset).toBe('last_7_days');
		expect(defaultControls({ ...capped, max_range_days: 30 }).preset).toBe('last_30_days');
	});
	it('switching from a 90-day report resets to 7 days', () => {
		const prev = { ...defaultControls(flow), preset: 'last_90_days' as const };
		expect(controlsForEntry(capped, prev).preset).toBe('last_7_days');
		expect(controlsForEntry(capped, { ...prev, preset: 'last_7_days' }).preset).toBe('last_7_days');
	});
});

describe('deltaDisplay', () => {
	it('handles zero baselines', () => {
		expect(deltaDisplay('0', '0', '', true)).toEqual({ label: '—', tone: 'default', kind: 'flat-zero' });
		expect(deltaDisplay('50', '0', '', true)).toEqual({ label: 'New', tone: 'info', kind: 'new' });
	});
	it('colours by meaning, not sign', () => {
		expect(deltaDisplay('110', '100', '10', true)).toEqual({ label: '+10.0%', tone: 'success', kind: 'pct' });
		expect(deltaDisplay('18.5', '16.4', '12.8', false)).toEqual({ label: '+12.8%', tone: 'failed', kind: 'pct' });
		expect(deltaDisplay('90', '100', '-10', false)).toEqual({ label: '-10.0%', tone: 'success', kind: 'pct' });
		expect(deltaDisplay('-50', '-100', '-50', true)).toEqual({ label: '-50.0%', tone: 'success', kind: 'pct' });
	});
	it('flat under half a percent', () => {
		expect(deltaDisplay('100.2', '100', '0.2', true)).toEqual({ label: '+0.2%', tone: 'default', kind: 'pct' });
	});
	it('returns null for non-finite input', () => {
		expect(deltaDisplay('abc', '100', '', true)).toBeNull();
		expect(deltaDisplay('100', 'x', '', true)).toBeNull();
		expect(deltaDisplay('100', '100', 'NaN', true)).toBeNull();
	});
	it('never renders negative zero', () => {
		expect(deltaDisplay('100', '100', '-0.0', true)?.label).toBe('+0.0%');
		expect(deltaDisplay('99.999', '100', '-0.001', true)?.label).toBe('+0.0%');
	});
	it('returns null without a comparison', () => {
		expect(deltaDisplay('100', undefined, undefined, true)).toBeNull();
	});
});

describe('series and totals', () => {
	it('filters by currency', () => {
		expect(currenciesOf(result)).toEqual(['usd', 'eur']);
		expect(toSeries(result, 'invoice_total', 'usd')).toEqual([
			{ label: '2026-08-01T00:00:00Z', current: 100, prev: 80 },
			{ label: '2026-09-01T00:00:00Z', current: 150, prev: 100 },
		]);
		expect(totalsFor(result, 'invoice_total', 'usd')).toEqual({ current: 250, prev: 180 });
	});
	it('defaults to the first currency when none chosen', () => {
		expect(toSeries(result, 'invoice_total', '')).toEqual([
			{ label: '2026-08-01T00:00:00Z', current: 100, prev: 80 },
			{ label: '2026-09-01T00:00:00Z', current: 150, prev: 100 },
		]);
		expect(totalsFor(result, 'invoice_total', '')).toEqual({ current: 250, prev: 180 });
	});
});

describe('breakdown-only reports', () => {
	const aging: ReportCatalogEntry = {
		...flow,
		key: 'aging',
		kind: 'snapshot',
		shapes: ['breakdown'],
		default_shape: 'breakdown',
		dimensions: [{ key: 'aging_bucket', label: 'Aging bucket' }],
		grains: [],
		supports_compare: false,
	};
	it('sends its default dimension without a group-by choice', () => {
		expect(buildRequest(aging, defaultControls(aging), NOW)).toEqual({
			shape: 'breakdown',
			range: rangeForPreset('last_90_days', NOW),
			dimensions: ['aging_bucket'],
		});
	});
	it('falls back to its default dimension when group-by is not allowed', () => {
		expect(controlsForEntry(aging, { ...defaultControls(flow), groupBy: 'customer_id' }).groupBy).toBe('aging_bucket');
	});
});

describe('non-finite values', () => {
	it('treat as zero in series and totals', () => {
		const bad: ReportQueryResult = { ...result, rows: [['2026-08-01T00:00:00Z', 'usd', 'oops', 'NaN', '']] };
		expect(toSeries(bad, 'invoice_total', 'usd')).toEqual([{ label: '2026-08-01T00:00:00Z', current: 0, prev: 0 }]);
		expect(totalsFor(bad, 'invoice_total', 'usd')).toEqual({ current: 0, prev: 0 });
	});
});

describe('inclusiveEnd', () => {
	it('subtracts one day from an exclusive end', () => {
		expect(inclusiveEnd('2026-09-01T00:00:00Z')).toBe('2026-08-31');
		expect(inclusiveEnd('2026-01-01T00:00:00Z')).toBe('2025-12-31');
	});
});

describe('formatValue', () => {
	it('puts the sign before the symbol', () => {
		expect(formatValue(-1234, 'money', 'usd')).toBe('-$1,234');
	});
	it('uses the injected days label', () => {
		expect(formatValue(16.44, 'days', 'usd', (v) => `${v} يوم`)).toBe('16.4 يوم');
	});
	it('formats by value type', () => {
		expect(formatValue(16.44, 'days', 'usd')).toBe('16.4 days');
		expect(formatValue(1720, 'count', 'usd')).toBe('1,720');
		expect(formatValue(1234.5, 'money', 'usd')).toContain('1,234.5');
	});
});

describe('isBucketInProgress', () => {
	const at = (...a: [number, number, number, number?, number?]) => new Date(Date.UTC(...a));
	it('month is open until the first of next month', () => {
		expect(isBucketInProgress('2026-10-01T00:00:00Z', 'month', at(2026, 9, 31, 23, 59))).toBe(true);
		expect(isBucketInProgress('2026-10-01T00:00:00Z', 'month', at(2026, 10, 1))).toBe(false);
		expect(isBucketInProgress('2026-12-01T00:00:00Z', 'month', at(2026, 11, 31))).toBe(true);
		expect(isBucketInProgress('2026-09-01T00:00:00Z', 'month', NOW)).toBe(false);
	});
	it('week spans seven days', () => {
		expect(isBucketInProgress('2026-10-12T00:00:00Z', 'week', at(2026, 9, 18, 23))).toBe(true);
		expect(isBucketInProgress('2026-10-12T00:00:00Z', 'week', at(2026, 9, 19))).toBe(false);
	});
	it('day ends at UTC midnight', () => {
		expect(isBucketInProgress('2026-10-12T00:00:00Z', 'day', NOW)).toBe(true);
		expect(isBucketInProgress('2026-10-12T00:00:00Z', 'day', at(2026, 9, 13))).toBe(false);
		expect(isBucketInProgress('2026-10-11T00:00:00Z', 'day', NOW)).toBe(false);
	});
	it('is false without a grain or valid date', () => {
		expect(isBucketInProgress('2026-10-12T00:00:00Z', '', NOW)).toBe(false);
		expect(isBucketInProgress('cus_1', 'day', NOW)).toBe(false);
	});
});

describe('isToDatePreset', () => {
	it('is true only for calendar-to-date presets', () => {
		expect(['this_month', 'this_quarter', 'this_year'].every((p) => isToDatePreset(p as never))).toBe(true);
		expect(['last_7_days', 'last_month', 'last_90_days'].some((p) => isToDatePreset(p as never))).toBe(false);
	});
});

describe('buildRequest filters', () => {
	it('sends only filters the report allows', () => {
		const c = {
			...defaultControls(flow),
			filters: [
				{ field: 'customer_id', op: 'eq' as const, value: ['cust_1'] },
				{ field: 'meter_id', op: 'eq' as const, value: ['m1'] },
			],
		};
		expect(buildRequest(flow, c, NOW).filters).toEqual([{ field: 'customer_id', op: 'eq', value: ['cust_1'] }]);
		expect(buildRequest(flow, defaultControls(flow), NOW).filters).toBeUndefined();
	});
});

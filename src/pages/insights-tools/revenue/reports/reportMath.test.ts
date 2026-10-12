import { describe, it, expect } from 'vitest';
import { ReportCatalogEntry, ReportQueryResult } from '@/types/dto/Reports';
import {
	buildRequest,
	controlsForEntry,
	currenciesOf,
	defaultControls,
	deltaDisplay,
	formatValue,
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
	higher_is_better: true,
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
	it('computes UTC, end-exclusive ranges', () => {
		expect(rangeForPreset('this_month', NOW)).toBe('2026-10-01..2026-11-01');
		expect(rangeForPreset('last_month', NOW)).toBe('2026-09-01..2026-10-01');
		expect(rangeForPreset('this_quarter', NOW)).toBe('2026-10-01..2027-01-01');
		expect(rangeForPreset('this_year', NOW)).toBe('2026-01-01..2027-01-01');
		expect(rangeForPreset('last_30_days', NOW)).toBe('2026-09-13..2026-10-13');
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
	it('sends currency only when chosen', () => {
		expect(buildRequest(flow, { ...defaultControls(flow), currency: 'usd' }, NOW).currency).toBe('usd');
		expect(buildRequest(flow, { ...defaultControls(flow), currency: '' }, NOW).currency).toBeUndefined();
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
});

describe('deltaDisplay', () => {
	it('handles zero baselines', () => {
		expect(deltaDisplay('0', '0', '', true)).toEqual({ label: '—', tone: 'default' });
		expect(deltaDisplay('50', '0', '', true)).toEqual({ label: 'New', tone: 'info' });
	});
	it('colours by meaning, not sign', () => {
		expect(deltaDisplay('110', '100', '10', true)).toEqual({ label: '+10.0%', tone: 'success' });
		expect(deltaDisplay('18.5', '16.4', '12.8', false)).toEqual({ label: '+12.8%', tone: 'failed' });
		expect(deltaDisplay('90', '100', '-10', false)).toEqual({ label: '-10.0%', tone: 'success' });
	});
	it('flat under half a percent', () => {
		expect(deltaDisplay('100.2', '100', '0.2', true)).toEqual({ label: '+0.2%', tone: 'default' });
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
});

describe('formatValue', () => {
	it('formats by value type', () => {
		expect(formatValue(16.44, 'days', 'usd')).toBe('16.4 days');
		expect(formatValue(1720, 'count', 'usd')).toBe('1,720');
		expect(formatValue(1234.5, 'money', 'usd')).toContain('1,234.5');
	});
});

import { describe, expect, it } from 'vitest';
import { ReportColumn, ReportQueryResult } from '@/types/dto/Reports';
import { bucketLabel, splitRevenue, mergeSeries, OTHER_KEY, pivotSeries, sumField, topKeys, withContract } from './revenueMath';

const res = (cols: [string, ReportColumn['role']][], rows: string[][]): ReportQueryResult => ({
	columns: cols.map(([name, role]) => ({ name, role, type: role === 'dimension' ? 'string' : 'decimal' })),
	rows,
	meta: { query_source: 'test' },
});

const revenue = res(
	[
		['bucket', 'dimension'],
		['currency', 'dimension'],
		['invoice_total', 'metric'],
		['invoice_total_prev', 'metric'],
	],
	[
		['2026-02-01T00:00:00Z', 'usd', '500', '400'],
		['2026-01-01T00:00:00Z', 'usd', '1000', '800'],
		['2026-01-01T00:00:00Z', 'eur', '9', '9'],
	],
);
const usage = res(
	[
		['bucket', 'dimension'],
		['currency', 'dimension'],
		['m0', 'metric'],
	],
	[
		['2026-01-01T00:00:00Z', 'usd', '300'],
		['2026-02-01T00:00:00Z', 'usd', '700'],
	],
);

describe('revenueMath', () => {
	it('caps usage at revenue so the split sums to revenue', () => {
		expect(splitRevenue(1000, 300)).toEqual({ usage: 300, contract: 700 });
		expect(splitRevenue(500, 700)).toEqual({ usage: 500, contract: 0 });
		expect(splitRevenue(-50, 10)).toEqual({ usage: 0, contract: 0 });
	});

	it('merges series per bucket and currency, sorted', () => {
		const rows = mergeSeries(
			{
				revenue: { result: revenue, column: 'invoice_total' },
				prev: { result: revenue, column: 'invoice_total_prev' },
				usage: { result: usage, column: 'm0' },
				usagePrev: { result: usage, column: 'm0_prev' },
			},
			'usd',
		);
		expect(rows).toEqual([
			{ bucket: '2026-01-01', revenue: 1000, prev: 800, usage: 300 },
			{ bucket: '2026-02-01', revenue: 500, prev: 400, usage: 700 },
		]);
		const withC = withContract(rows);
		expect(withC.map((r) => r.contract)).toEqual([700, 0]);
		expect(withC.map((r) => r.usage)).toEqual([300, 500]);
		expect(sumField(withC, 'usage')! + sumField(withC, 'contract')!).toBe(sumField(withC, 'revenue'));
		expect(withC.map((r) => r.contractPrev)).toEqual([800, 400]);
	});

	it('pivots a dimension and folds the tail into other', () => {
		const grouped = res(
			[
				['bucket', 'dimension'],
				['customer_id', 'dimension'],
				['currency', 'dimension'],
				['invoice_total', 'metric'],
			],
			[
				['2026-01-01T00:00:00Z', 'a', 'usd', '10'],
				['2026-01-01T00:00:00Z', 'b', 'usd', '30'],
				['2026-01-01T00:00:00Z', 'c', 'usd', '5'],
				['2026-02-01T00:00:00Z', 'a', 'usd', '15'],
			],
		);
		const p = pivotSeries(grouped, 'invoice_total', 'customer_id', 'usd');
		expect(p.keys).toEqual(['b', 'a', 'c']);
		const top = topKeys(p, 1);
		expect(top.keys).toEqual(['b', OTHER_KEY]);
		expect(top.rows).toEqual([
			{ bucket: '2026-01-01', b: 30, [OTHER_KEY]: 15 },
			{ bucket: '2026-02-01', [OTHER_KEY]: 15 },
		]);
	});

	it('labels buckets by grain', () => {
		expect(bucketLabel('2026-01-01', 'month')).toBe('Jan 2026');
		expect(bucketLabel('2026-01-05', 'day')).toBe('Jan 5');
		expect(bucketLabel('Total', 'month')).toBe('Total');
	});
});
